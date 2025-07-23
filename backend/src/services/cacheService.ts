/**
 * Redis Cache Service - Advanced caching strategies for AI responses and TTS audio
 * Requirements: 15.1 - Performance optimization through caching
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from './loggerService';
import { on } from 'events';
import e from 'express';
import { error } from 'console';
import { error } from 'console';
import { gunzip } from 'zlib';
import { error } from 'console';
import { error } from 'console';
import { error } from 'console';
import e from 'express';
import voice from '@/routes/voice';
import { text } from 'express';
import { response } from 'express';
import { response } from 'express';
import { error } from 'console';
import e from 'express';
import { on } from 'events';
import { error } from 'console';
import { error } from 'console';
import { error } from 'console';
import voice from '@/routes/voice';
import { text } from 'express';
import { response } from 'express';

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Whether to compress large values
 port
}

export class CacheService {
  private client!: RedisClientType;
  private isConnected: boolean 
  private st
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalKeys: 0,
    MB'
  };

  // Cache key prefixes for different data types
  private readonly AI_RESPONSE_PREFIX = 'ai_response:';
  private readonly TTS_AUDIO_PREFIX = 'tts_audio:';
  private readonly USER_SESSION_PREFIX = 'user_sessio:';
:';

  // Default TTL values (in seconds)
  private readonly DEFAULT_TTL ={
    AI_RESPONSE: 3600, // 1 hou
    TTS_AUDIO: 7200, // 2 hours
    USER_SESSION: 1800, // 30 utes
    e
;

  constructor() {
   nt();


  /**
   * dling
   */
  private> {
    try {
      :6379';
      
      this.client = cr{
        url: redi,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (r
            if (retries > 10) {
              logger.error('Rediss', {
                service: 'cache',
                m}
              });
             se;
            }
           00);
          }
        }
   });

      // Event handlers
      this.client.on('connect', () => {
        l});
 });

      this.client.on('ready', () => {
        this.isConnected = true;
        l});


      this.client.on('error', (er
        this.isConnected = false;
        logger.error('Redisrror', {
          service:,
          error: {
            message: error.message,
           or.stack
          }
        }
});

      this.client.on('end', () =>
        this.isConnected = false;
        l);


      // Connect to Redis


    } catch (error) {
      this.isConnected = false;
      logger.error('Faile
        service:
        error: {
          message: error instanceof Error ? error.message : 'Unknror',
         fined
        }
      });
   }


  /**
   * available
   */
  public isAvailable(): boolean {
   
  }

  /**
   * eration
   */
  public async cacheAIe(
    userInput: st
    context: any,
    response: string,
    options: CacheOptio
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      logger.warn(');
     alse;


    try {
      // Include language in context for language-specific cac

        ...context,
        language:
      };
      
      const cacheKey = this.generateAIRespons
      coONSE;

      const cacheData = {
        response,
,
        userInput: userInput.substring(0, 100), // Storeing
age),
        language: options.language || context.language '
      };

      const serializedData = JSON.stringify(cacheData);
      const fi

      awaa);


        service: '
 {
          cacheKey: c
          ttl,
          dataSize: final,
          langua
        }
      });

      return true;

   {

     ',
        error: {
     
        }
      });
      return false;
    }
  }

  /**
e
   */
  public async getCachedAIResponse(
    userInput: string,
t: any
  ): Promise<string | nu{
    if (!this.isAvailable())
      return null;
    }

    try {
      // Include language in context for language-specieval
= {
        ...context,
        language: context.language || 'en'
      };
      
      const cacheKey );
      const cachedData = await this.client.get(cacheKey);

      if (!{
        this.stats.misses++;
        return null;
      }

edData);
      const parsedData =

y
      if (!parsedData.response || !parsedDataestamp) {
        logger.warn('Inva', {
          service: ',
          metadata: {
            cacheKey: cacheKey.substring(0, 50) 
          }
        });
eKey);
        this.stats.misses++;

      }

      this.stats.hits++;
      this.updat);

      logt', {
        s',
        metadata: {
          cacheKey + '...',
     ,
   en'
   }
      });

     se;

    } catch (error) {
      logger.error
        service: 'cache',
        error: {
          message: error instanceof Error ? error.mess error'
        }
      });
      this.stats.misses++;
      return null;
    }
}

  /**
   * Cache TTS audio buffer

  public async cacheTTSAudio(
    text: string,
    voice: string,
    speed: number,
    audioBuffer,
    options: C}
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      lo});
;
    }

ry {
      const language = options.language || 'default';
ge);
      const ttl = options.ttl || this.DEFAULT_TTL.TTSIO;

      const cacheDa
        audioBuffer: audioBuffer.toString('base64'),
        timest
        text: text.substring(0, 100), //ging
        voice,
        s
        lage,
gth
      };

      const serializea);
      const finalData = options.compress ? await ;

      await thisata);

      log', {
        she',
        metadata: {
     ..',
   
ength,
     
          language
      }
      });

      return true;

    } catch (error) {
      logger.error('Failed to, {
        service: 'cache',
        error: {
     or'
    }
      });
      return false;
    }
}

  /**
   * Retrieve cachedio
   */
o(
    text: string,
    voice: string,
,
    language?: string
  ): Promise<Buffer | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const);
      const cachedData = await this.clie

      if (!cachedDat) {
       +;
null;
      }

edData);
      const parsedData = JSON.parse(decompressedData);

      // Validate cache data integrity
      if (!parsedData.audmestamp) {
        logger.warnata', {
          service: 'cache',
          metadata: {
            cacheKey: cacheKey.substrin...'
         }
        });
ey);
        this.stats.misses;

      }

      this.stats.hits++;
      this.updatate();

      con);

      logger.debug('TTS au
        service: 'e',
     ta: {
   ..',
amp,
     
          language: parsedDat'
       }
      });

      return audioBuffer;

    } catch (error) {
      logger.error('Failed to dio', {
        service: 'cche',
     
 error'
        }
      });
      this.stats.misses++;
;
    }
  }

  /**
ata
   */
  public async cac(
g,
    sessionData: any,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isAv{
      return false;
    }

    try {
      const cacheKe;
     ON;

y({
     
        timestamp: Date.now(),
     en'
      });

      await this.c
     

    } cat
      logger.error('Failed to cache user session', {
        service: 'cache',
ssionId,
        error: {
          message: e
       
  });
      return false;

  }

  /**
   * Retrieve cachion
   */
  public async getCachedUserSession(sessionId: string): Promise<any | null>
    if (!able()) {
      retll;
    }

   ry {
`;
     heKey);

      {
        return null;
      }

     edData);

    } cator) {
      logger.error('Failed to retrieve cached user 
        service: 'cache',
        sessionId
        {

        }
});
      return null;
    }
  }

  /**
   * Inva
   */
{
    if (!this.isAvailable)) {
 return 0;
    }

    try {
      const keys = 
      if (keys.le0) {
        return 0;
      }

      awael(keys);

      logger.in
     ',
   adata: {
attern,
     ngth
        }
      });

      return keys.length;

    }
{
        she',
        metadata: {
          pattern
       },
        error: {
          message: error instanceof Error ? error.message : 'Unknown ror'
        }

      return 0;
    }


 /**
   * Get cache statiscs
   */
  public async getCacheStats> {
    if (!this.is{
      return this.stats;
    }

    try {
     ');
   bSize();

      INFO
      const memoryMatch = in);
      '0B';

      this.stats.totalKeys = kCount;
      this.stats.mee;

;

    } catch (error) {
      
        service: 'cache',
        error: {
          messagrror'
        }
      });
      return this.stats;
    }
  }

  /**
   * Clear all cac
   */
  public async clearC
    if (!this.isAvailable()) {
      return false;
    }

    try {
      awa;
      
     ts
   s = {
: 0,
      0,
        hitRate: 0,
     : 0,
        memoryUsage: '0MB'
      };

      logger.info('Cache cleared suche' });
      return true;

    } c {
    e', {
        service: 'cache',
   
rror'
        }
      });
     se;
    }
  }

  /**
   nses

  pring {
    const inputHash = this.hashString
    cObject({
      sessionId: context.sessionId,
      conversatio,
      legalDisclaimer: context.legalDiscla
      language: context.language || 'en'
    });
    
    rash}`;
  }


   * S audio
   */
  pri
    const textHash = this.hashString(tex
    return `${this.TTS_AUDIO_PREFIX}${textHash}_${voice}_${spage}`;
  }

 /**
   * 
   */
  pri
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
   

    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Hash object for consistent cache keys
   */
  private hashObject {
    con));
    re
  }

  /**
   * Uion
   */
  private updateHitRate(): void {
    const total = thi;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 1: 0;
  }

  /**
   * Comps
   */
  private async co
    try {
   fit

     
      }
     
      const zlib = require('zlib');
      cone('util');
      const gzip = util.promisify(zlib.gzip);
      
      const compressed = await gzip(Buffer.from(data));
      r
    } 
      logger.warn('Compression fail{
        service: 'cache',
        error: {
       error'
        }
      });
      return data;
    }
  }

  /**
   * Dezip
   */
  private async decompress(data: string): Promise<string> {
    try {
      // Check i
      if (!data.startsWith('H4sI') && !data.match(/^[A-Za-z0-9+/=]+$/)) {
        r4
      }
      
     ;
   
);
      
      try {
     ase64');
        const decompressed = await gunzip(bu
        return decompressed.toString();
      } catch {
        // If gunzip fails, it d
        return data;
      }
   
 
'cache',
        error: {
          message: error instanceof Error ? err);acheService(e = new CheServicrt const cacexpostance
on innglet si Export  }
}

// }
);
   : 'cache' } serviceted', {connecnt dislie('Redis cer.info
      logg= false;nected onisC     this.onnect();
 nt.disciet this.cl     awai
 onnected) { this.isCs.client &&if (thi
    void> {e<t(): Promisnecsconsync di  public an
   */
 connectio Redis
   * Close/**
    }

    }
;n data      retur     });
  }
 r'
      n erroknowessage : 'Unor.m