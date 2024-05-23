const { sortByDate, readData, readMetadata, readReadMe, getLocalDataRoot, getLocalDocRoot } = require('../helper');
const { getItemSourceDir, cacheClassifyItems, createBeforeReadHook, generateMarkdown, createGenerator } = require('./helper');

const collectionName = 'notes';

function resolveItemData(sourceRootPath, id, item, _, cache) {
  const sourceDir = getItemSourceDir(sourceRootPath, item);
  const content = readReadMe(sourceDir)
    .replace(/(?:\<img (?:.+)?)src=\"([^\"]+)\"/g, (match, srcPath) => match.replace(srcPath, `/knosys/${collectionName}/${id}/${srcPath}`))
    .replace(/!\[([^\[\]]+)?\]\(([^\(\)]+)\)/g, (match, _, srcPath) => match.replace(srcPath, `/knosys/${collectionName}/${id}/${srcPath}`));

  const note = { ...readMetadata(sourceDir), id, content };
  const sharedMetadata = readData(`${sourceDir}/.meta/shared.yml`) || {};

  if (sharedMetadata.date) {
    note.sharedAt = sharedMetadata.date;
  }

  cache.content = note.content;

  cacheClassifyItems(cache, id, note);

  return note;
}

module.exports = {
  createNoteGenerator: (sourceRootPath, sharedRootPath) => createGenerator(collectionName, sharedRootPath, getLocalDataRoot, getLocalDocRoot, {
    paramPath: 'id',
    metadataRequired: false,
    getItemImageSourceDir: getItemSourceDir.bind(null, sourceRootPath),
    transformItem: resolveItemData.bind(null, sourceRootPath),
    transformData: items => ({ items, sequence: sortByDate(Object.keys(items).map(key => items[key])).map(({ id }) => id) }),
    beforeRead: createBeforeReadHook(collectionName),
    readEach: generateMarkdown.bind(null, collectionName),
  }),
};
