import { UseGuards } from '@nestjs/common';
import { Args, Field, ID, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { PlayerService } from './player.service';

@ObjectType()
export class PlayerType {
    @Field(() => ID) id!: string;
    @Field() serverId!: string;
    @Field(() => Int) fivemId!: number;
    @Field() name!: string;
    @Field({ nullable: true }) steam?: string;
    @Field({ nullable: true }) license?: string;
    @Field({ nullable: true }) discord?: string;
    @Field({ nullable: true }) fivem?: string;
    @Field(() => Int) totalPlaytime!: number;
    @Field(() => Int) joinCount!: number;
    @Field() lastSeen!: Date;
    @Field(() => [String]) notes!: string[];
    @Field(() => [String]) flags!: string[];
    @Field() isBanned!: boolean;
    @Field({ nullable: true }) banReason?: string;
    @Field({ nullable: true }) banExpiry?: Date;
}

@ObjectType()
export class PlayerActionType {
    @Field(() => ID) id!: string;
    @Field() playerId!: string;
    @Field() adminId!: string;
    @Field() type!: string;
    @Field() reason!: string;
    @Field(() => Int, { nullable: true }) duration?: number;
    @Field() createdAt!: Date;
}

@Resolver(() => PlayerType)
export class PlayerResolver {
    constructor(private playerService: PlayerService) { }

    @Query(() => [PlayerType])
    @UseGuards(AuthGuard)
    async players(@Args('serverId') serverId: string) {
        return this.playerService.getPlayers(serverId);
    }

    @Query(() => PlayerType)
    @UseGuards(AuthGuard)
    async player(@Args('id') id: string) {
        return this.playerService.getPlayer(id);
    }

    @Query(() => [PlayerType])
    @UseGuards(AuthGuard)
    async searchPlayers(@Args('query') query: string) {
        return this.playerService.searchPlayers(query);
    }

    @Mutation(() => PlayerActionType)
    @UseGuards(AuthGuard)
    async kickPlayer(
        @Args('playerId') playerId: string,
        @Args('adminId') adminId: string,
        @Args('reason') reason: string,
    ) {
        return this.playerService.kickPlayer(playerId, adminId, reason);
    }

    @Mutation(() => PlayerActionType)
    @UseGuards(AuthGuard)
    async banPlayer(
        @Args('playerId') playerId: string,
        @Args('adminId') adminId: string,
        @Args('reason') reason: string,
        @Args('duration', { nullable: true }) duration?: number,
    ) {
        return this.playerService.banPlayer(playerId, adminId, reason, duration);
    }

    @Mutation(() => PlayerActionType)
    @UseGuards(AuthGuard)
    async unbanPlayer(
        @Args('playerId') playerId: string,
        @Args('adminId') adminId: string,
    ) {
        return this.playerService.unbanPlayer(playerId, adminId);
    }
}
