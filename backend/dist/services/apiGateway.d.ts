import { Request, Response, NextFunction } from 'express';
export interface RouteConfig {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    serviceName: string;
    targetPath?: string;
    tags?: string[];
    timeout?: number;
    retries?: number;
    rateLimit?: {
        windowMs: number;
        max: number;
    };
    authentication?: boolean;
    authorization?: string[];
    transform?: {
        request?: (req: any) => any;
        response?: (res: any) => any;
    };
}
export interface ProxyRequest {
    originalUrl: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    query?: Record<string, string>;
    params?: Record<string, string>;
}
export interface ProxyResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: any;
    responseTime: number;
}
export declare class APIGateway {
    private static instance;
    private routes;
    private requestCounter;
    private constructor();
    static getInstance(): APIGateway;
    registerRoute(config: RouteConfig): void;
    createMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private proxyRequest;
    private buildTargetUrl;
    private prepareHeaders;
    private extractHeaders;
    private sendProxyResponse;
    private sendErrorResponse;
    private generateRequestId;
    getStats(): {
        totalRoutes: number;
        registeredServices: number;
        loadBalancerStats: any;
        circuitBreakerStats: any;
    };
    getRoutes(): RouteConfig[];
    removeRoute(method: string, path: string): void;
    clearRoutes(): void;
}
export declare const apiGateway: APIGateway;
//# sourceMappingURL=apiGateway.d.ts.map