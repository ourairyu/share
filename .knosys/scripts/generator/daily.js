const { sortByDate, readMetadata, readReadMe } = require('../helper');
const { getItemSourceDir, cacheClassifyItems, createGenerator } = require('./helper');

const collectionName = 'dailies';

function resolveItemData(sourceRootPath, id, item, _, cache) {
  const sourceDir = getItemSourceDir(sourceRootPath, item);
  const content = readReadMe(sourceDir)
    .replace(/(?:\<img (?:.+)?)src=\"([^\"]+)\"/g, (match, srcPath) => match.replace(srcPath, `/knosys/${collectionName}/${id}/${srcPath}`))
    .replace(/!\[([^\[\]]+)?\]\(([^\(\)]+)\)/g, (match, _, srcPath) => match.replace(srcPath, `/knosys/${collectionName}/${id}/${srcPath}`));

  const note = { ...readMetadata(sourceDir), id, content };
  const [category, collection, ...args] = item.source.split('/');

  note.title = `日报 ${args[0]}${args[1]}${args[2]}${note.title ? '：' + note.title : ''}`;
  console.log('note.title:', args);

  cache.content = note.content;

  cacheClassifyItems(cache, id, note);

  return note;
}

module.exports = {
  createDailyGenerator: (sourceRootPath, sharedRootPath) => createGenerator(sourceRootPath, sharedRootPath, collectionName, {
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
  }),
};
