import { UseGuards } from '@nestjs/common';
import { Args, Context, Field, InputType, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@ObjectType()
export class AuthPayload {
    @Field() accessToken!: string;
    @Field() refreshToken!: string;
    @Field(() => UserPayload, { nullable: true }) user?: UserPayload;
}

@ObjectType()
export class UserPayload {
    @Field() id!: string;
    @Field() username!: string;
    @Field() email!: string;
    @Field() role!: string;
    @Field({ nullable: true }) avatar?: string;
    @Field() mfaEnabled!: boolean;
    @Field(() => [String]) permissions!: string[];
}

@InputType()
export class LoginInput {
    @Field() username!: string;
    @Field() password!: string;
}

@InputType()
export class RegisterInput {
    @Field() username!: string;
    @Field() email!: string;
    @Field() password!: string;
}

@Resolver()
export class AuthResolver {
    constructor(private authService: AuthService) { }

    @Mutation(() => AuthPayload)
    async login(@Args('input') input: LoginInput) {
        return this.authService.login(input.username, input.password);
    }

    @Mutation(() => AuthPayload)
    async register(@Args('input') input: RegisterInput) {
        return this.authService.register(input.username, input.email, input.password);
    }

    @Query(() => UserPayload)
    @UseGuards(AuthGuard)
    async me(@Context() context: { req: { user: { sub: string } } }) {
        return this.authService.getProfile(context.req.user.sub);
    }
}
