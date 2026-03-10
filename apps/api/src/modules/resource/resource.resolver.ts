import { UseGuards } from '@nestjs/common';
import { Args, Field, Float, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { ResourceService } from './resource.service';

@ObjectType()
export class ResourceType {
    @Field() name!: string;
    @Field() state!: string;
    @Field({ nullable: true }) version?: string;
    @Field({ nullable: true }) author?: string;
    @Field({ nullable: true }) description?: string;
    @Field() path!: string;
    @Field(() => [String]) dependencies!: string[];
    @Field(() => [String]) dependents!: string[];
    @Field(() => Float) cpuUsage!: number;
    @Field(() => Float) memoryUsage!: number;
    @Field(() => Float) tickTime!: number;
    @Field(() => Int) errorCount!: number;
    @Field({ nullable: true }) lastError?: string;
}

@ObjectType()
class GraphNode {
    @Field() id!: string;
    @Field() state!: string;
    @Field(() => Float) cpu!: number;
    @Field(() => Float) memory!: number;
}

@ObjectType()
class GraphEdge {
    @Field() from!: string;
    @Field() to!: string;
}

@ObjectType()
class DependencyGraph {
    @Field(() => [GraphNode]) nodes!: GraphNode[];
    @Field(() => [GraphEdge]) edges!: GraphEdge[];
}

@Resolver(() => ResourceType)
export class ResourceResolver {
    constructor(private resourceService: ResourceService) { }

    @Query(() => [ResourceType])
    @UseGuards(AuthGuard)
    async resources(@Args('serverId') serverId: string) {
        return this.resourceService.getResources(serverId);
    }

    @Query(() => ResourceType, { nullable: true })
    @UseGuards(AuthGuard)
    async resource(@Args('serverId') serverId: string, @Args('name') name: string) {
        return this.resourceService.getResource(serverId, name);
    }

    @Query(() => DependencyGraph)
    @UseGuards(AuthGuard)
    async resourceDependencyGraph(@Args('serverId') serverId: string) {
        return this.resourceService.getDependencyGraph(serverId);
    }
}
