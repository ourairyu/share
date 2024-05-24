const { resolve: resolvePath } = require('path');
const { existsSync } = require('fs');

const { resolveRootPath, scanAndSortByAsc, ensureDirExists, getLocalDataRoot, getLocalDocRoot } = require('../helper');
const { createWeeklyGenerator, createNoteGenerator, createProjectGenerator, createRepoGenerator } = require('../generator');

let sourceRootPath;

module.exports = {
  execute: dataSource => {
    const srcPath = resolvePath(resolveRootPath(), dataSource);

    if (!existsSync(srcPath)) {
      return;
    }

    [getLocalDataRoot(), getLocalDocRoot()].forEach(distPath => ensureDirExists(distPath, true));

    sourceRootPath = resolvePath(srcPath, 'data');

    const sharedRootPath = resolvePath(srcPath, 'shared');
    const generators = {
      weeklies: createWeeklyGenerator(sourceRootPath, sharedRootPath),
      notes: createNoteGenerator(sourceRootPath, sharedRootPath),
      projects: createProjectGenerator(sourceRootPath, sharedRootPath),
      repos: createRepoGenerator(sourceRootPath, sharedRootPath),
    };

    scanAndSortByAsc(sharedRootPath).forEach(collection => generators[collection] && generators[collection]());
  },
};
