const { resolve: resolvePath } = require('path');

const { dump } = require('js-yaml');
const { pick } = require('@ntks/toolbox');

const { sortByDate, ensureDirExists, readData, saveData, readMetadata } = require('../helper');
const { getItemSourceDir, getCollectionRoot, createGenerator } = require('./helper');

const collectionName = 'repos';

function resolveRepoItems(rawItems, sourceDir) {
  return rawItems
    .map(({ text, uri, children }) => {
      const resolved = { text };

      if (uri) {
        let url;

        if (uri.startsWith('http') || uri.startsWith('/')) {
          url = uri;
        } else if (uri.startsWith('../')) {
          const sourceDirPath = resolvePath(resolvePath(sourceDir, uri), '..');
          const itemMetadata = readMetadata(sourceDirPath);

          if (itemMetadata.share !== 'public') {
            return null;
          }

          url = `/notes/${readData(`${sourceDirPath}/.meta/shared.yml`).id}/`;

          if (!resolved.text) {
            resolved.text = itemMetadata.title;
          }
        }

        if (url) {
          resolved.url = url;
        }
      }

      if (children) {
        resolved.children = resolveRepoItems(children, sourceDir);
      }

      return resolved;
    })
    .filter(item => !!item);
}

function resolveItemData(sourceRootPath, id, item) {
  const sourceDir = getItemSourceDir(sourceRootPath, item);
  const repo = { ...readMetadata(sourceDir), ...pick(item, ['banner', 'cover']), id };

  if (repo.items) {
    repo.items = resolveRepoItems(repo.items, sourceDir);
  }

  const sharedMetadata = readData(`${sourceDir}/.meta/shared.yml`) || {};

  if (sharedMetadata.date) {
    repo.sharedAt = sharedMetadata.date;
  }

  return repo;
}

function generateRepoItemContent(items, level = 0) {
  return items.map(({ text, url, children }) => {
    const resolved = [`${'  '.repeat(level)}- ` + (url ? `[${text}](${url})` : text)];

    if (children) {
      resolved.push(generateRepoItemContent(children, level + 1));
    }

    return resolved.join('\n');
  }).join('\n');
}

function generateMarkdown(id, item) {
  if (!item) {
    return;
  }

  const itemDirPath = `${getCollectionRoot(collectionName)}/${id}`;
  const data = Object.keys(item)
    .filter(key => ['title', 'description', 'date', 'tags', 'categories', 'banner'].includes(key) && item[key])
    .reduce((acc, key) => ({ ...acc, [key]: item[key] }), {});

  data.permalink = `/topics/${id}/`;

  ensureDirExists(itemDirPath);
  saveData(`${itemDirPath}/index.md`, `---\n${dump(data)}---\n` + (item.items ? `\n${generateRepoItemContent(item.items)}\n` : ''));
}

module.exports = {
  createRepoGenerator: (sourceRootPath, sharedRootPath) => createGenerator(sourceRootPath, sharedRootPath, collectionName, {
    transformItem: resolveItemData.bind(null, sourceRootPath),
    transformData: items => ({ items, sequence: sortByDate(Object.keys(items).map(key => items[key])).map(({ id }) => id) }),
    readEach: generateMarkdown,
  }),
};
