import { UseGuards } from '@nestjs/common';
import { Args, Field, ID, InputType, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { AuthGuard } from '../auth/auth.guard';
import { AutomationService } from './automation.service';

@ObjectType()
export class AutomationRuleType {
    @Field(() => ID) id!: string;
    @Field() name!: string;
    @Field() description!: string;
    @Field() enabled!: boolean;
    @Field({ nullable: true }) serverId?: string;
    @Field() triggerType!: string;
    @Field(() => GraphQLJSON) conditions!: Record<string, unknown>;
    @Field(() => Int) cooldown!: number;
    @Field(() => GraphQLJSON) actions!: unknown;
    @Field({ nullable: true }) lastTriggered?: Date;
    @Field(() => Int) triggerCount!: number;
    @Field() createdAt!: Date;
}

@InputType()
class CreateAutomationInput {
    @Field() name!: string;
    @Field({ nullable: true }) description?: string;
    @Field({ nullable: true }) serverId?: string;
    @Field() triggerType!: string;
    @Field(() => GraphQLJSON) conditions!: Record<string, unknown>;
    @Field(() => Int, { nullable: true }) cooldown?: number;
    @Field(() => GraphQLJSON) actions!: Array<{ type: string; params: Record<string, unknown>; order: number }>;
}

@Resolver(() => AutomationRuleType)
export class AutomationResolver {
    constructor(private automationService: AutomationService) { }

    @Query(() => [AutomationRuleType])
    @UseGuards(AuthGuard)
    async automationRules(@Args('serverId', { nullable: true }) serverId?: string) {
        return this.automationService.getRules(serverId);
    }

    @Query(() => AutomationRuleType, { nullable: true })
    @UseGuards(AuthGuard)
    async automationRule(@Args('id') id: string) {
        return this.automationService.getRule(id);
    }

    @Mutation(() => AutomationRuleType)
    @UseGuards(AuthGuard)
    async createAutomationRule(@Args('input') input: CreateAutomationInput) {
        return this.automationService.createRule(input);
    }

    @Mutation(() => Boolean)
    @UseGuards(AuthGuard)
    async deleteAutomationRule(@Args('id') id: string) {
        return this.automationService.deleteRule(id);
    }

    @Mutation(() => AutomationRuleType)
    @UseGuards(AuthGuard)
    async toggleAutomationRule(@Args('id') id: string, @Args('enabled') enabled: boolean) {
        return this.automationService.updateRule(id, { enabled });
    }
}
