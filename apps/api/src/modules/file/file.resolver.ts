import { UseGuards } from '@nestjs/common';
import { Args, Field, Float, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { FileService } from './file.service';

@ObjectType()
export class FileEntryType {
    @Field() name!: string;
    @Field() path!: string;
    @Field() type!: string;
    @Field(() => Float) size!: number;
    @Field(() => Float) modified!: number;
}

@ObjectType()
export class FileContentType {
    @Field() path!: string;
    @Field() content!: string;
    @Field() encoding!: string;
    @Field(() => Float) size!: number;
    @Field(() => Float) modified!: number;
}

@Resolver()
export class FileResolver {
    constructor(private fileService: FileService) { }

    @Query(() => [FileEntryType])
    @UseGuards(AuthGuard)
    async listFiles(
        @Args('basePath') basePath: string,
        @Args('path', { defaultValue: '.' }) path: string,
    ) {
        return this.fileService.listDirectory(basePath, path);
    }

    @Query(() => FileContentType)
    @UseGuards(AuthGuard)
    async readFile(
        @Args('basePath') basePath: string,
        @Args('path') path: string,
    ) {
        return this.fileService.readFileContent(basePath, path);
    }

    @Mutation(() => Boolean)
    @UseGuards(AuthGuard)
    async writeFile(
        @Args('basePath') basePath: string,
        @Args('path') path: string,
        @Args('content') content: string,
    ) {
        return this.fileService.writeFileContent(basePath, path, content);
    }
}
