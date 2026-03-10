import { UseGuards } from '@nestjs/common';
import { Args, Field, ID, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { AuthGuard } from '../auth/auth.guard';
import { AlertService } from './alert.service';

@ObjectType()
export class AlertType {
    @Field(() => ID) id!: string;
    @Field() serverId!: string;
    @Field() severity!: string;
    @Field() title!: string;
    @Field() message!: string;
    @Field() acknowledged!: boolean;
    @Field({ nullable: true }) acknowledgedBy?: string;
    @Field({ nullable: true }) resolvedAt?: Date;
    @Field(() => GraphQLJSON, { nullable: true }) metadata?: Record<string, unknown>;
    @Field() createdAt!: Date;
}

@Resolver(() => AlertType)
export class AlertResolver {
    constructor(private alertService: AlertService) { }

    @Query(() => [AlertType])
    @UseGuards(AuthGuard)
    async alerts(
        @Args('serverId', { nullable: true }) serverId?: string,
        @Args('acknowledged', { nullable: true }) acknowledged?: boolean,
    ) {
        return this.alertService.getAlerts(serverId, acknowledged);
    }

    @Mutation(() => AlertType)
    @UseGuards(AuthGuard)
    async acknowledgeAlert(@Args('id') id: string, @Args('userId') userId: string) {
        return this.alertService.acknowledgeAlert(id, userId);
    }

    @Mutation(() => AlertType)
    @UseGuards(AuthGuard)
    async resolveAlert(@Args('id') id: string) {
        return this.alertService.resolveAlert(id);
    }
}
