export interface CDNConfig {
    enabled: boolean;
    baseUrl: string;
    regions: string[];
    cacheHeaders: {
        [key: string]: string;
    };
}
export interface AssetOptimization {
    compression: boolean;
    minification: boolean;
    imageOptimization: boolean;
    caching: boolean;
}
export declare class CDNService {
    private config;
    private optimization;
    constructor();
    getAssetUrl(assetPath: string, assetType?: 'js' | 'css' | 'image' | 'font' | 'audio'): string;
    getCacheHeaders(assetType: 'js' | 'css' | 'image' | 'font' | 'audio' | 'html'): {
        [key: string]: string;
    };
    generateETag(content: string | Buffer): string;
    shouldUseCDN(assetPath: string): boolean;
    getFrontendConfig(): {
        enabled: boolean;
        baseUrl: string;
        assetVersion: string;
    };
    cacheMiddleware(): (req: any, res: any, next: any) => void;
    private getAssetType;
    getStats(): {
        enabled: boolean;
        baseUrl: string;
        regions: number;
        optimization: AssetOptimization;
    };
    purgeCDNCache(paths?: string[]): Promise<boolean>;
    private purgeCloudflareCache;
    private purgeCloudFrontCache;
    private purgeFastlyCache;
    private purgeAkamaiCache;
}
export declare const cdnService: CDNService;
//# sourceMappingURL=cdnService.d.ts.map