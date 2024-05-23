const { sortByDate, readMetadata, readReadMe, getLocalDataRoot, getLocalDocRoot } = require('../helper');
const { getItemSourceDir, cacheClassifyItems, createBeforeReadHook, generateMarkdown, createGenerator } = require('./helper');

const collectionName = 'weeklies';

function resolveItemData(sourceRootPath, id, item, _, cache) {
  const sourceDir = getItemSourceDir(sourceRootPath, item);
  const content = readReadMe(sourceDir)
    .replace(/(?:\<img (?:.+)?)src=\"([^\"]+)\"/g, (match, srcPath) => match.replace(srcPath, `/knosys/${collectionName}/${id}/${srcPath}`))
    .replace(/!\[([^\[\]]+)?\]\(([^\(\)]+)\)/g, (match, _, srcPath) => match.replace(srcPath, `/knosys/${collectionName}/${id}/${srcPath}`));

  const note = { ...readMetadata(sourceDir), id, content };
  const [category, collection, ...args] = item.source.split('/');

  note.title = `周报 ${args[0]}W${args[1]}${note.title ? '：' + note.title : ''}`;

  cache.content = note.content;

  cacheClassifyItems(cache, id, note);

  return note;
}

module.exports = {
  createWeeklyGenerator: (sourceRootPath, sharedRootPath) => createGenerator(collectionName, sharedRootPath, getLocalDataRoot, getLocalDocRoot, {
    paramPath: 'id',
    metadataRequired: false,
    getItemImageSourceDir: getItemSourceDir.bind(null, sourceRootPath),
    transformItem: resolveItemData.bind(null, sourceRootPath),
    transformData: items => {
      const sequence = sortByDate(Object.keys(items).map(key => items[key])).map(({ id }) => id);
      const yearly = {};

      sequence.forEach(id => {
        const year = id.split('-').shift();

        if (!yearly[year]) {
          yearly[year] = [];
        }

        yearly[year].push(id);
      });

      return { items, sequence, yearly: Object.keys(yearly).sort().map(year => ({ year, ids: yearly[year] })) };
    },
    beforeRead: createBeforeReadHook(collectionName),
    readEach: generateMarkdown.bind(null, collectionName),
  }),
};
