[![Build Status](https://github.com/dscheerens/ngx-ast-transform/actions/workflows/main.yml/badge.svg?branch=master)](https://github.com/dscheerens/ngx-ast-transform/actions/workflows/main.yml) [![NPM Version](https://img.shields.io/npm/v/ngx-ast-transform.svg)](https://www.npmjs.com/package/ngx-ast-transform)

# ngx-ast-transform

TypeScript AST transformers are awesome!
Unfortunately, the Angular CLI does not [currently](https://github.com/angular/angular/issues/22434) provide a way to include them in the compilation pipeline.
So, that is where the `ngx-ast-transform` package comes in: it makes the usage of TypeScript AST transformers possible in conjunction with the Angular CLI.
This depends on customizing the webpack configuration, which can be done using something like [`ngx-build-plus`](https://github.com/manfredsteyer/ngx-build-plus) or [`@angular-builders/custom-webpack`](https://github.com/just-jeb/angular-builders/tree/master/packages/custom-webpack).

## Disclaimer

Since AST transformers are not officially supported by the Angular CLI, this package must rely on private APIs.
While this currently works like a charm, there is no guarantee that this continues to be the case in the future.
In fact, the private APIs used to add AST transformers have changed in the past, so this is not an unlikely scenario.
However, the purpose of the `ngx-ast-transform` package is to allow you to adapt to those changes without having to make any changes to the setup of your project.

**Keep in mind though that no guarantees can be made here.
Future breaking changes may make it impossible to continue the support of custom AST transformers.**

## Compatibility

The current version of the `ngx-ast-tranform` package works for the **Angular CLI version 12 and higher**.
If you wish to make use of TypeScript AST transformers for older Angular CLI versions, then you can follow the approach outlined in the following article:

_[Custom Typescript Transformers with Angular CLI](https://medium.com/joolsoftware/custom-typescript-transformers-with-angular-cli-7f4150797e05)_

## Installation & usage

As usual, you will need to add the package as (dev) dependency to your project:

```shell
npm i -D ngx-ast-transform
```

If your project doesn't already have a custom webpack configuration for the Angular CLI, you will first need to set that up.
Great tools for that are [`ngx-build-plus`](https://github.com/manfredsteyer/ngx-build-plus) or [`@angular-builders/custom-webpack`](https://github.com/just-jeb/angular-builders/tree/master/packages/custom-webpack).
Personally, I prefer the latter since it makes it easy to write the configuration setup in TypeScript without the need to (manually) compile it first to JavaScript.

### Usage with **@angular-builders/custom-webpack**

To make use of this package you will need to [setup your custom webpack configuration using a function](https://github.com/just-jeb/angular-builders/tree/master/packages/custom-webpack#custom-webpack-config-function).
This can be either done in JavaScript or TypeScript.
Below you can find example configuration functions for either language.

**JavaScript**
```javascript
const { addTransformer } = require('ngx-ast-transform');

module.exports = function(webpackConfig) {
  addTransformer(webpackConfig, myAstTransformer());
}
```

**TypeScript**
```typescript
import { addTransformer } from 'ngx-ast-transform';
import { Configuration } from 'webpack';

export default function(webpackConfig: Configuration): Configuration {
  addTransformer(webpackConfig, myAstTransformer());

  return webpackConfig;
};
```

### Usage with **ngx-build-plus**

This package can also be used with **ngx-build-plus**.
In that case you will need to [modify the webpack configuration via a plugin](https://github.com/manfredsteyer/ngx-build-plus#using-plugins).
**ngx-build-plus** expects plugins to be `.js` files.
Therefore, if you wish to define your custom webpack configuration in TypeScript then you will need to transpile it first to JavaScript.
Example configurations for both languages are found below.

**JavaScript**
```javascript
const { addTransformer } = require('ngx-ast-transform');

module.exports = {
  default: {
    config(webpackConfig) {
      addTransformer(webpackConfig, myAstTransformer());

      return webpackConfig;
    }
  }
};
```

**TypeScript**
```typescript
import { addTransformer } from 'ngx-ast-transform';
import { Configuration } from 'webpack';

export default {
  config(webpackConfig: Configuration): Configuration {
    addTransformer(webpackConfig, myAstTransformer());

    return webpackConfig;
  }
}
```

## API

The API of this package is simple.
It only exposes the following two things:

* The `addTransformer` function, which has the following signature:

  ```typescript
  function addTransformer(webpackConfig: Configuration, createTransformers: CreateTransformer): void;
  ```

  The first parameter is the webpack configuration object to which the AST transformer needs to be added.
  And the second parameter is a factory function that returns the transformer (or an array of transformers).
* The `CreateTransformer` type.
  This is the data type of the second parameter of the `addTransformer` function.
  It is a type-alias for a factory function that given a [`Program`](https://github.com/microsoft/TypeScript/blob/v4.5.5/src/compiler/types.ts#L3934-L4044) as input, returns either a single transformer or an array of transformers ([`TransformerFactory<SourceFile> | CustomTransformerFactory`](https://github.com/microsoft/TypeScript/blob/v4.5.5/src/compiler/types.ts#L4075)).
  The `program` is useful since it allows access to the `TypeChecker`.
  A typical instance of the `CreateTransformer` type looks as follows:

  ```typescript
  (program) => (context) => (sourceFile) => {
    const transformedSourceFile = sourceFile; // <-- apply transformations here

    return transformedSourceFile;
  }
  ```

  You might not always need the `program` and `context` parameters.
  In that case you can just leave them out:

  ```typescript
  () => () => (sourceFile) => {
    const transformedSourceFile = sourceFile; // <-- apply transformations here

    return transformedSourceFile;
  }
  ```

## An example transformer

The code snippet below shows an example AST transformer that simply logs all the source files to which it is applied.
It doesn't make any transformations.
You can use this as a base template for your own transformers or to adapt existing transformers into a type that matches with `CreateTransformer`.

```typescript
import { CreateTransformer } from 'ngx-ast-transform';

export function myAstTransformer(): CreateTransformer {
  return (program) => (context) => (sourceFile) => {
    console.log('Transforming:', sourceFile.fileName);

    return sourceFile;
  };
}
```

Note that the transformer above is wrapped into a function.
While this is not strictly necessary for the simple transformer above, it does show how you could parameterize it.
For example, we could add a filter option:

```typescript
import { CreateTransformer } from 'ngx-ast-transform';
import { SourceFile } from 'typescript'

interface MyAstTransformerOptions {
  filter?(sourceFile: SourceFile): boolean;
}

export function myAstTransformer(
  options: MyAstTransformerOptions = {}
): CreateTransformer {
  return () => () => (sourceFile) => {
    if (options.filter?.(sourceFile) ?? true) {
      console.log('Transforming:', sourceFile.fileName);
    }

    return sourceFile;
  };
}
```

## Limitations

Currently it is not possible to use TypeScript AST transformers when building libraries using [ng-packgr](https://github.com/ng-packagr/ng-packagr).
This means that the `ngx-ast-tranform` package only works for Angular applications (that are compiled via the Angular CLI).
