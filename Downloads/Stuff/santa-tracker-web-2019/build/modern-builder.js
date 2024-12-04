/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const resolveNode = require('./resolve-node.js');
const rollup = require('rollup');
const transformFutureModules = require('./transform-future-modules.js');
const rollupPluginCJS = require('rollup-plugin-commonjs');
const path = require('path');
const importUtils = require('./import-utils.js');


module.exports = async (entrypoints, options) => {
  options = Object.assign({
    loader: () => {},
    external: () => {},
    metaUrlScope: null,
    commonJS: false,
    workDir: null,
    format: 'esm',
  }, options);

  const resolveNodePlugin = {resolveId: resolveNode};

  const virtualPlugin = {
    async load(idToLoad) {
      if (idToLoad.startsWith('\0')) {
        return;
      }

      if (idToLoad.startsWith('/')) {
        idToLoad = path.relative(process.cwd(), idToLoad);
      }

      const entrypoint = entrypoints[idToLoad];
      if (entrypoint) {
        return entrypoint;
      }

      return options.loader(idToLoad);
    },
    transform(content, id) {
      if (!id.endsWith('.js')) {
        return transformFutureModules(id, content.code || content);
      }
    },
    resolveId(importee, importer) {
      let id = undefined;

      if (importer === undefined) {
        id = importee;
      } else if (importee.match(/^\.{1,2}\//)) {
        id = path.join(path.dirname(importer), importee);
      }

      // support marking depepdencies as external with a possible rewrite
      if (id) {
        const ret = options.external(id);
        if (ret) {
          if (typeof ret === 'string') {
            id = ret;
          }
          return {id, external: true};
        }
      }

      return id;
    },
    resolveImportMeta(prop, {moduleId}) {
      if (prop !== 'url') {
        throw new TypeError(`got unsupported import.meta.${prop} request for: ${moduleId}`);
      } else if (!options.metaUrlScope) {
        throw new TypeError(`import.meta.url request without metaUrlScope: ${moduleId}`);
      }

      const rel = path.relative(options.workDir, moduleId);
      const output = importUtils.join(options.metaUrlScope, rel);

      // TODO(samthor): escape
      return `'${output}'`;
    },
  };

  const input = {};
  Object.keys(entrypoints).forEach((id) => {
    input[id] = id;
  });

  const plugins = [resolveNodePlugin, virtualPlugin];
  if (options.commonJS) {
    plugins.push(rollupPluginCJS());
  }

  const bundle = await rollup.rollup({input, plugins});

  const generated = await bundle.generate({
    format: options.format,
    entryFileNames: '[name]',  // we expect .js to be provided
    chunkFileNames: path.join(options.workDir || '', '_[hash].js'),
  });

  // console.info('got bundle of modules', Object.keys(generated.output).length);
  // console.debug(generated.output);

  return generated.output;
};
