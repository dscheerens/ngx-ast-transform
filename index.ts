import { AngularWebpackPlugin } from '@ngtools/webpack';
import { BuilderProgram, CustomTransformerFactory, CustomTransformers, Program, SourceFile, TransformerFactory } from 'typescript';
import { Configuration } from 'webpack';

type UnitOrArray<T> = T | T[];

export type CreateTransformer = (program: Program) => UnitOrArray<TransformerFactory<SourceFile> | CustomTransformerFactory>;

export function addTransformer(webpackConfig: Configuration, createTransformers: CreateTransformer): void {
    const plugins = (webpackConfig.plugins ?? []);

    const angularWebpackPlugin = plugins.find(
        (plugin): plugin is AngularWebpackPluginWithPrivateApi => plugin instanceof AngularWebpackPlugin,
    );

    if (!angularWebpackPlugin) {
        return;
    }

    const originalCreateFileEmitterFunction = angularWebpackPlugin.createFileEmitter;

    angularWebpackPlugin.createFileEmitter = function(program, transformers, getExtraDependencies, onAfterEmit) {
        for (const transformer of coerceToArray(createTransformers(program.getProgram()))) {
            transformers.before?.push(transformer);
        }

        return originalCreateFileEmitterFunction.call(this, program, transformers, getExtraDependencies, onAfterEmit);
    };
}

type AngularWebpackPluginWithPrivateApi = Omit<AngularWebpackPlugin, 'createFileEmitter'> & {
    createFileEmitter(
        program: BuilderProgram,
        transformers: CustomTransformers,
        getExtraDependencies: (sourceFile: SourceFile) => Iterable<string>,
        onAfterEmit?: (sourceFile: SourceFile) => void,
    ): unknown;
};

function coerceToArray<T>(value: UnitOrArray<T>): T[] {
    return Array.isArray(value) ? value : [value];
}
