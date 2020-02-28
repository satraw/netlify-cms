import { OrderedMap, fromJS } from 'immutable';
import { configLoaded } from 'Actions/config';
import collections, {
  selectAllowDeletion,
  selectEntryPath,
  selectEntrySlug,
  selectFieldsWithMediaFolders,
  selectMediaFolders,
  getFieldsNames,
  selectField,
  updateFieldByKey,
} from '../collections';
import { FILES, FOLDER } from 'Constants/collectionTypes';

describe('collections', () => {
  it('should handle an empty state', () => {
    expect(collections(undefined, {})).toEqual(null);
  });

  it('should load the collections from the config', () => {
    expect(
      collections(
        undefined,
        configLoaded(
          fromJS({
            collections: [
              {
                name: 'posts',
                folder: '_posts',
                fields: [{ name: 'title', widget: 'string' }],
              },
            ],
          }),
        ),
      ),
    ).toEqual(
      OrderedMap({
        posts: fromJS({
          name: 'posts',
          folder: '_posts',
          fields: [{ name: 'title', widget: 'string' }],
          type: FOLDER,
        }),
      }),
    );
  });

  describe('selectAllowDeletions', () => {
    it('should not allow deletions for file collections', () => {
      expect(
        selectAllowDeletion(
          fromJS({
            name: 'pages',
            type: FILES,
          }),
        ),
      ).toBe(false);
    });
  });

  describe('selectEntryPath', () => {
    it('should return path', () => {
      expect(
        selectEntryPath(
          fromJS({
            type: FOLDER,
            folder: 'posts',
          }),
          'dir1/dir2/slug',
        ),
      ).toBe('posts/dir1/dir2/slug.md');
    });
  });

  describe('selectEntrySlug', () => {
    it('should return slug', () => {
      expect(
        selectEntrySlug(
          fromJS({
            type: FOLDER,
            folder: 'posts',
          }),
          'posts/dir1/dir2/slug.md',
        ),
      ).toBe('dir1/dir2/slug');
    });
  });

  describe('selectFieldsMediaFolders', () => {
    it('should return empty array for invalid collection', () => {
      expect(selectFieldsWithMediaFolders(fromJS({}))).toEqual([]);
    });

    it('should return configs for folder collection', () => {
      expect(
        selectFieldsWithMediaFolders(
          fromJS({
            folder: 'posts',
            fields: [
              {
                name: 'image',
                media_folder: 'image_media_folder',
              },
              {
                name: 'body',
                media_folder: 'body_media_folder',
              },
              {
                name: 'list_1',
                field: {
                  name: 'list_1_item',
                  media_folder: 'list_1_item_media_folder',
                },
              },
              {
                name: 'list_2',
                fields: [
                  {
                    name: 'list_2_item',
                    media_folder: 'list_2_item_media_folder',
                  },
                ],
              },
              {
                name: 'list_3',
                types: [
                  {
                    name: 'list_3_type',
                    media_folder: 'list_3_type_media_folder',
                  },
                ],
              },
            ],
          }),
        ),
      ).toEqual([
        fromJS({
          name: 'image',
          media_folder: 'image_media_folder',
        }),
        fromJS({ name: 'body', media_folder: 'body_media_folder' }),
        fromJS({ name: 'list_1_item', media_folder: 'list_1_item_media_folder' }),
        fromJS({
          name: 'list_2_item',
          media_folder: 'list_2_item_media_folder',
        }),
        fromJS({
          name: 'list_3_type',
          media_folder: 'list_3_type_media_folder',
        }),
      ]);
    });

    it('should return configs for files collection', () => {
      expect(
        selectFieldsWithMediaFolders(
          fromJS({
            files: [
              {
                name: 'file1',
                fields: [
                  {
                    name: 'image',
                    media_folder: 'image_media_folder',
                  },
                ],
              },
              {
                name: 'file2',
                fields: [
                  {
                    name: 'body',
                    media_folder: 'body_media_folder',
                  },
                ],
              },
              {
                name: 'file3',
                fields: [
                  {
                    name: 'list_1',
                    field: {
                      name: 'list_1_item',
                      media_folder: 'list_1_item_media_folder',
                    },
                  },
                ],
              },
              {
                name: 'file4',
                fields: [
                  {
                    name: 'list_2',
                    fields: [
                      {
                        name: 'list_2_item',
                        media_folder: 'list_2_item_media_folder',
                      },
                      {
                        name: 'list_3',
                        types: [
                          {
                            name: 'list_3_type',
                            media_folder: 'list_3_type_media_folder',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          }),
          'file4',
        ),
      ).toEqual([
        fromJS({
          name: 'list_2_item',
          media_folder: 'list_2_item_media_folder',
        }),
        fromJS({
          name: 'list_3_type',
          media_folder: 'list_3_type_media_folder',
        }),
      ]);
    });
  });

  describe('selectMediaFolders', () => {
    const slug = {
      encoding: 'unicode',
      clean_accents: false,
      sanitize_replacement: '-',
    };

    const config = fromJS({ slug, media_folder: '/static/img' });
    it('should return fields and collection folders', () => {
      expect(
        selectMediaFolders(
          { config },
          fromJS({
            folder: 'posts',
            media_folder: '{{media_folder}}/general/',
            fields: [
              {
                name: 'image',
                media_folder: '{{media_folder}}/customers/',
              },
              {
                name: 'list',
                types: [{ name: 'widget', media_folder: '{{media_folder}}/widgets' }],
              },
            ],
          }),
          fromJS({ slug: 'name', path: 'src/post/post1.md', data: {} }),
        ),
      ).toEqual([
        'static/img/general',
        'static/img/general/customers',
        'static/img/general/widgets',
      ]);
    });

    it('should return fields, file and collection folders', () => {
      expect(
        selectMediaFolders(
          { config },
          fromJS({
            media_folder: '{{media_folder}}/general/',
            files: [
              {
                name: 'name',
                file: 'src/post/post1.md',
                media_folder: '{{media_folder}}/customers/',
                fields: [
                  {
                    name: 'image',
                    media_folder: '{{media_folder}}/logos/',
                  },
                  {
                    name: 'list',
                    types: [{ name: 'widget', media_folder: '{{media_folder}}/widgets' }],
                  },
                ],
              },
            ],
          }),
          fromJS({ slug: 'name', path: 'src/post/post1.md', data: {} }),
        ),
      ).toEqual([
        'static/img/general',
        'static/img/general/customers',
        'static/img/general/customers/logos',
        'static/img/general/customers/widgets',
      ]);
    });
  });

  describe('getFieldsNames', () => {
    it('should get flat fields names', () => {
      const collection = fromJS({
        fields: [{ name: 'en' }, { name: 'es' }],
      });
      expect(getFieldsNames(collection.get('fields').toArray())).toEqual(['en', 'es']);
    });

    it('should get nested fields names', () => {
      const collection = fromJS({
        fields: [
          { name: 'en', fields: [{ name: 'title' }, { name: 'body' }] },
          { name: 'es', fields: [{ name: 'title' }, { name: 'body' }] },
          { name: 'it', field: { name: 'title', fields: [{ name: 'subTitle' }] } },
          {
            name: 'fr',
            fields: [{ name: 'title', widget: 'list', types: [{ name: 'variableType' }] }],
          },
        ],
      });
      expect(getFieldsNames(collection.get('fields').toArray())).toEqual([
        'en',
        'es',
        'it',
        'fr',
        'en.title',
        'en.body',
        'es.title',
        'es.body',
        'it.title',
        'it.title.subTitle',
        'fr.title',
        'fr.title.variableType',
      ]);
    });
  });

  describe('selectField', () => {
    it('should return top field by key', () => {
      const collection = fromJS({
        fields: [{ name: 'en' }, { name: 'es' }],
      });
      expect(selectField(collection, 'en')).toBe(collection.get('fields').get(0));
    });

    it('should return nested field by key', () => {
      const collection = fromJS({
        fields: [
          { name: 'en', fields: [{ name: 'title' }, { name: 'body' }] },
          { name: 'es', fields: [{ name: 'title' }, { name: 'body' }] },
          { name: 'it', field: { name: 'title', fields: [{ name: 'subTitle' }] } },
          {
            name: 'fr',
            fields: [{ name: 'title', widget: 'list', types: [{ name: 'variableType' }] }],
          },
        ],
      });

      expect(selectField(collection, 'en.title')).toBe(
        collection
          .get('fields')
          .get(0)
          .get('fields')
          .get(0),
      );

      expect(selectField(collection, 'it.title.subTitle')).toBe(
        collection
          .get('fields')
          .get(2)
          .get('field')
          .get('fields')
          .get(0),
      );

      expect(selectField(collection, 'fr.title.variableType')).toBe(
        collection
          .get('fields')
          .get(3)
          .get('fields')
          .get(0)
          .get('types')
          .get(0),
      );
    });
  });

  describe('updateFieldByKey', () => {
    it('should update field by key', () => {
      const collection = fromJS({
        fields: [
          { name: 'title' },
          { name: 'image' },
          {
            name: 'object',
            fields: [{ name: 'title' }, { name: 'gallery', fields: [{ name: 'image' }] }],
          },
          { name: 'list', field: { name: 'image' } },
          { name: 'body' },
          { name: 'widgetList', types: [{ name: 'widget' }] },
        ],
      });

      const updater = field => field.set('default', 'default');

      expect(updateFieldByKey(collection, 'non-existent', updater)).toBe(collection);
      expect(updateFieldByKey(collection, 'title', updater)).toEqual(
        fromJS({
          fields: [
            { name: 'title', default: 'default' },
            { name: 'image' },
            {
              name: 'object',
              fields: [{ name: 'title' }, { name: 'gallery', fields: [{ name: 'image' }] }],
            },
            { name: 'list', field: { name: 'image' } },
            { name: 'body' },
            { name: 'widgetList', types: [{ name: 'widget' }] },
          ],
        }),
      );
      expect(updateFieldByKey(collection, 'object.title', updater)).toEqual(
        fromJS({
          fields: [
            { name: 'title' },
            { name: 'image' },
            {
              name: 'object',
              fields: [
                { name: 'title', default: 'default' },
                { name: 'gallery', fields: [{ name: 'image' }] },
              ],
            },
            { name: 'list', field: { name: 'image' } },
            { name: 'body' },
            { name: 'widgetList', types: [{ name: 'widget' }] },
          ],
        }),
      );

      expect(updateFieldByKey(collection, 'object.gallery.image', updater)).toEqual(
        fromJS({
          fields: [
            { name: 'title' },
            { name: 'image' },
            {
              name: 'object',
              fields: [
                { name: 'title' },
                { name: 'gallery', fields: [{ name: 'image', default: 'default' }] },
              ],
            },
            { name: 'list', field: { name: 'image' } },
            { name: 'body' },
            { name: 'widgetList', types: [{ name: 'widget' }] },
          ],
        }),
      );
      expect(updateFieldByKey(collection, 'list.image', updater)).toEqual(
        fromJS({
          fields: [
            { name: 'title' },
            { name: 'image' },
            {
              name: 'object',
              fields: [{ name: 'title' }, { name: 'gallery', fields: [{ name: 'image' }] }],
            },
            { name: 'list', field: { name: 'image', default: 'default' } },
            { name: 'body' },
            { name: 'widgetList', types: [{ name: 'widget' }] },
          ],
        }),
      );

      expect(updateFieldByKey(collection, 'widgetList.widget', updater)).toEqual(
        fromJS({
          fields: [
            { name: 'title' },
            { name: 'image' },
            {
              name: 'object',
              fields: [{ name: 'title' }, { name: 'gallery', fields: [{ name: 'image' }] }],
            },
            { name: 'list', field: { name: 'image' } },
            { name: 'body' },
            { name: 'widgetList', types: [{ name: 'widget', default: 'default' }] },
          ],
        }),
      );
    });
  });
});
