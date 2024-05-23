const { resolve: resolvePath } = require('path');
const { existsSync } = require('fs');

const { resolveRootPath, readData, saveData, scanAndSortByAsc } = require('../../helper');
const { createNotesGenerator } = require('./notes');

let sourceRootPath;

module.exports = {
  execute: dataSource => {
    const srcPath = resolvePath(resolveRootPath(), dataSource);

    if (!existsSync(srcPath)) {
      return;
    }

    sourceRootPath = resolvePath(srcPath, 'data');

    const sharedRootPath = resolvePath(srcPath, 'shared');
    const generators = {
      notes: createNotesGenerator(sourceRootPath, sharedRootPath),
    };

    scanAndSortByAsc(sharedRootPath).forEach(collection => generators[collection] && generators[collection]());
  },
};
