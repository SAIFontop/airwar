import { UseGuards } from '@nestjs/common';
import { Args, Field, Float, ID, InputType, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { ServerService } from './server.service';

@ObjectType()
export class ServerType {
    @Field(() => ID) id!: string;
    @Field() name!: string;
    @Field() hostname!: string;
    @Field(() => Int) port!: number;
    @Field(() => Int) maxPlayers!: number;
    @Field() gameBuild!: string;
    @Field() serverDataPath!: string;
    @Field() cfgPath!: string;
    @Field() autoRestart!: boolean;
    @Field(() => [String]) scheduledRestarts!: string[];
    @Field(() => [String]) tags!: string[];
    @Field() status!: string;
    @Field(() => Int, { nullable: true }) pid?: number;
    @Field({ nullable: true }) version?: string;
    @Field(() => Int) playersOnline!: number;
    @Field(() => Float) cpu!: number;
    @Field(() => Float) memory!: number;
    @Field(() => Float) tickRate!: number;
    @Field(() => Float) uptime!: number;
    @Field() createdAt!: Date;
}

@InputType()
export class CreateServerInput {
    @Field() name!: string;
    @Field() hostname!: string;
    @Field(() => Int, { defaultValue: 30120 }) port!: number;
    @Field(() => Int, { defaultValue: 48 }) maxPlayers!: number;
    @Field() serverDataPath!: string;
    @Field() cfgPath!: string;
    @Field(() => [String], { defaultValue: [] }) tags!: string[];
}

@InputType()
export class UpdateServerInput {
    @Field({ nullable: true }) name?: string;
    @Field({ nullable: true }) hostname?: string;
    @Field(() => Int, { nullable: true }) port?: number;
    @Field(() => Int, { nullable: true }) maxPlayers?: number;
    @Field({ nullable: true }) autoRestart?: boolean;
    @Field(() => [String], { nullable: true }) tags?: string[];
    @Field(() => [String], { nullable: true }) scheduledRestarts?: string[];
}

@Resolver(() => ServerType)
export class ServerResolver {
    constructor(private serverService: ServerService) { }

    @Query(() => [ServerType])
    @UseGuards(AuthGuard)
    async servers() {
        return this.serverService.getAllServers();
    }

    @Query(() => ServerType)
    @UseGuards(AuthGuard)
    async server(@Args('id') id: string) {
        return this.serverService.getServer(id);
    }

    @Mutation(() => ServerType)
    @UseGuards(AuthGuard)
    async createServer(@Args('input') input: CreateServerInput) {
        return this.serverService.createServer(input);
    }

    @Mutation(() => ServerType)
    @UseGuards(AuthGuard)
    async updateServer(@Args('id') id: string, @Args('input') input: UpdateServerInput) {
        return this.serverService.updateServer(id, input);
    }

    @Mutation(() => Boolean)
    @UseGuards(AuthGuard)
    async deleteServer(@Args('id') id: string) {
        return this.serverService.deleteServer(id);
    }

    @Mutation(() => ServerType)
    @UseGuards(AuthGuard)
    async startServer(@Args('id') id: string) {
        return this.serverService.startServer(id);
    }

    @Mutation(() => Boolean)
    @UseGuards(AuthGuard)
    async stopServer(@Args('id') id: string) {
        await this.serverService.stopServer(id);
        return true;
    }

    @Mutation(() => ServerType)
    @UseGuards(AuthGuard)
    async restartServer(@Args('id') id: string) {
        return this.serverService.restartServer(id);
    }

    @Mutation(() => Boolean)
    @UseGuards(AuthGuard)
    async sendCommand(@Args('serverId') serverId: string, @Args('command') command: string) {
        await this.serverService.sendCommand(serverId, command);
        return true;
    }
}
