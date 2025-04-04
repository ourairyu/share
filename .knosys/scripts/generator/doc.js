const { sortByDate, readData, readMetadata, readReadMe } = require('../helper');
const { getItemSourceDir, createGenerator } = require('./helper');

const collectionName = 'docs';

function resolveItemData(sourceRootPath, id, item, _, cache) {
  const sourceDir = getItemSourceDir(sourceRootPath, item);
  const content = readReadMe(sourceDir)
  .replace(/(?:\<img (?:.+)?)src=\"([^\"]+)\"/g, (match, srcPath) => match.replace(srcPath, `/knosys/${collectionName}/${id}/${srcPath}`))
  .replace(/!\[([^\[\]]+)?\]\(([^\(\)]+)\)/g, (match, _, srcPath) => match.replace(srcPath, `/knosys/${collectionName}/${id}/${srcPath}`))
    .replace(/\n## 任务\n/g, '\n## 任务\n').replace(/\- \[ \]/g, `- <input type="checkbox" disabled>`).replace(/\- \[X\]/ig, `- <input type="checkbox" disabled checked>`);

  const resolved = { ...readMetadata(sourceDir), id, content, code: item.code };
  const [collection, ...args] = item.source.split('/');

  if (collection === 'dailies') {
    resolved.title = `日报 ${args.join('')}${resolved.title ? '：' + resolved.title : ''}`;
  } else if (collection === 'weeklies') {
    resolved.title = `周报 ${args[0]}W${args[1]}${resolved.title ? '：' + resolved.title : ''}`;
  }

  cache.content = content;

  return resolved;
}

module.exports = {
  createDocGenerator: (sourceRootPath, sharedRootPath) => createGenerator(sourceRootPath, sharedRootPath, collectionName, {
    paramPath: 'id',
    metadataRequired: false,
    transformItem: resolveItemData.bind(null, sourceRootPath),
    transformData: items => ({ items, sequence: sortByDate(Object.keys(items).map(key => items[key])).map(({ id }) => id) }),
  }),
};
