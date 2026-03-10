import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    canActivate(context: ExecutionContext): boolean {
        const ctx = GqlExecutionContext.create(context);
        const req = ctx.getContext().req;

        const authHeader = req?.headers?.authorization;
        if (!authHeader) return false;

        const token = authHeader.replace('Bearer ', '');
        try {
            const payload = this.jwtService.verify(token);
            req.user = payload;
            return true;
        } catch {
            return false;
        }
    }
}
