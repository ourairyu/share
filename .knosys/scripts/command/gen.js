const { resolve: resolvePath } = require('path');
const { existsSync } = require('fs');

const { resolveRootPath, scanAndSortByAsc, ensureDirExists, getLocalDataRoot, getLocalDocRoot } = require('../helper');
const { createDailyGenerator, createWeeklyGenerator, createNoteGenerator, createProjectGenerator, createDocGenerator, createRepoGenerator, generateBookmarks } = require('../generator');

module.exports = {
  execute: dataSource => {
    const srcPath = resolvePath(resolveRootPath(), dataSource);

    if (!existsSync(srcPath)) {
      return;
    }

    [getLocalDataRoot(), getLocalDocRoot()].forEach(distPath => ensureDirExists(distPath, true));

    const sourceRootPath = resolvePath(srcPath, 'data');
    const sharedRootPath = resolvePath(srcPath, 'shared');

    const generators = {
      dailies: createDailyGenerator(sourceRootPath, sharedRootPath),
      weeklies: createWeeklyGenerator(sourceRootPath, sharedRootPath),
      notes: createNoteGenerator(sourceRootPath, sharedRootPath),
      projects: createProjectGenerator(sourceRootPath, sharedRootPath),
      docs: createDocGenerator(sourceRootPath, sharedRootPath),
      repos: createRepoGenerator(sourceRootPath, sharedRootPath),
    };

    scanAndSortByAsc(sharedRootPath).forEach(collection => generators[collection] && generators[collection]());
    generateBookmarks(sourceRootPath);
  },
};
