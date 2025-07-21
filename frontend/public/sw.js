// Ellie Voice Receptionist Service Worker
// Provides offline functionality, caching, and PWA features

const CACHE_NAME = 'ellie-voice-receptionist-v1.0.0';
const RUNTIME_CACHE = 'ellie-runtime-cache';
const AUDIO_CACHE = 'ellie-audio-cache';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other static assets as needed
];

// Runtime caching patterns
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: 'cache-first',
  // Network first for API calls
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate for dynamic content
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== AUDIO_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isAudioRequest(request)) {
    event.respondWith(handleAudioRequest(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for API request');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API failures
    return new Response(
      JSON.stringify({
        error: {
          code: 'OFFLINE',
          message: 'You are currently offline. Please check your internet connection.',
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Handle audio requests with special caching
async function handleAudioRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(AUDIO_CACHE);
      // Only cache smaller audio files to avoid storage issues
      const contentLength = networkResponse.headers.get('content-length');
      if (!contentLength || parseInt(contentLength) < 1024 * 1024) { // 1MB limit
        cache.put(request, networkResponse.clone());
      }
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Audio fetch failed:', error);
    return new Response('Audio unavailable offline', { status: 503 });
  }
}

// Handle generic requests with stale-while-revalidate
async function handleGenericRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Helper functions to identify request types
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isAudioRequest(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(mp3|wav|ogg|m4a|aac)$/) || 
         request.headers.get('accept')?.includes('audio/');
}

// Handle background sync for offline voice messages
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'voice-message-sync') {
    event.waitUntil(syncVoiceMessages());
  }
});

// Sync voice messages when back online
async function syncVoiceMessages() {
  try {
    // Get pending voice messages from IndexedDB
    const pendingMessages = await getPendingVoiceMessages();
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/voice/process', {
          method: 'POST',
          body: message.data
        });
        
        if (response.ok) {
          await removePendingVoiceMessage(message.id);
          console.log('[SW] Synced voice message:', message.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync voice message:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Ellie has a response for you',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open Ellie',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Ellie Voice Receptionist', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if no existing window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle message events from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_VOICE_MESSAGE') {
    event.waitUntil(cacheVoiceMessage(event.data.payload));
  }
});

// Cache voice message for offline sync
async function cacheVoiceMessage(messageData) {
  try {
    // Store in IndexedDB for background sync
    await storePendingVoiceMessage(messageData);
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('voice-message-sync');
    }
  } catch (error) {
    console.error('[SW] Failed to cache voice message:', error);
  }
}

// IndexedDB helpers for offline storage
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EllieVoiceDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id' });
      }
    };
  });
}

async function storePendingVoiceMessage(messageData) {
  const db = await openDB();
  const transaction = db.transaction(['pendingMessages'], 'readwrite');
  const store = transaction.objectStore('pendingMessages');
  
  const message = {
    id: Date.now().toString(),
    data: messageData,
    timestamp: new Date().toISOString()
  };
  
  return store.add(message);
}

async function getPendingVoiceMessages() {
  const db = await openDB();
  const transaction = db.transaction(['pendingMessages'], 'readonly');
  const store = transaction.objectStore('pendingMessages');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingVoiceMessage(messageId) {
  const db = await openDB();
  const transaction = db.transaction(['pendingMessages'], 'readwrite');
  const store = transaction.objectStore('pendingMessages');
  
  return store.delete(messageId);
}

console.log('[SW] Service worker loaded successfully');