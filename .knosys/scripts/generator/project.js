const { sortByDate, readData, readMetadata, readReadMe, getLocalDataRoot, getLocalDocRoot } = require('../helper');
const { getItemSourceDir, createBeforeReadHook, generateMarkdown, createGenerator } = require('./helper');

const collectionName = 'projects';

function resolveItemData(sourceRootPath, id, item, _, cache) {
  const sourceDir = getItemSourceDir(sourceRootPath, item);
  const content = readReadMe(sourceDir)
  .replace(/(?:\<img (?:.+)?)src=\"([^\"]+)\"/g, (match, srcPath) => match.replace(srcPath, `/knosys/${collectionName}/${id}/${srcPath}`))
  .replace(/!\[([^\[\]]+)?\]\(([^\(\)]+)\)/g, (match, _, srcPath) => match.replace(srcPath, `/knosys/${collectionName}/${id}/${srcPath}`))
    .replace(/\n## 任务\n/g, '\n## 任务\n{:#tasks}\n').replace(/\- \[ \]/g, `- <input type="checkbox" disabled>`).replace(/\- \[X\]/ig, `- <input type="checkbox" disabled checked>`);

  const project = { ...readMetadata(sourceDir), id };
  const sharedMetadata = readData(`${sourceDir}/.meta/shared.yml`) || {};

  if (sharedMetadata.date) {
    project.sharedAt = sharedMetadata.date;
  }

  if (Array.isArray(project.tasks)) {
    project.tasks = project.tasks.map(task => ({ ...task, status: task.status || 'waiting' }));
  }

  cache.content = content;

  return project;
}

module.exports = {
  createProjectGenerator: (sourceRootPath, sharedRootPath) => createGenerator(collectionName, sharedRootPath, getLocalDataRoot, getLocalDocRoot, {
    paramPath: 'id',
    metadataRequired: false,
    getItemImageSourceDir: getItemSourceDir.bind(null, sourceRootPath),
    transformItem: resolveItemData.bind(null, sourceRootPath),
    transformData: items => ({ items, sequence: sortByDate(Object.keys(items).map(key => items[key])).map(({ id }) => id) }),
    beforeRead: createBeforeReadHook(collectionName),
    readEach: generateMarkdown.bind(null, collectionName),
  }),
};
