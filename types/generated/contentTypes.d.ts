import type { Schema, Attribute } from '@strapi/strapi';

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    name: 'Permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    name: 'User';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    username: Attribute.String;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    registrationToken: Attribute.String & Attribute.Private;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    preferedLanguage: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    name: 'Role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    name: 'Api Token';
    singularName: 'api-token';
    pluralName: 'api-tokens';
    displayName: 'Api Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    name: 'API Token Permission';
    description: '';
    singularName: 'api-token-permission';
    pluralName: 'api-token-permissions';
    displayName: 'API Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    name: 'Transfer Token';
    singularName: 'transfer-token';
    pluralName: 'transfer-tokens';
    displayName: 'Transfer Token';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    name: 'Transfer Token Permission';
    description: '';
    singularName: 'transfer-token-permission';
    pluralName: 'transfer-token-permissions';
    displayName: 'Transfer Token Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    singularName: 'file';
    pluralName: 'files';
    displayName: 'File';
    description: '';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    alternativeText: Attribute.String;
    caption: Attribute.String;
    width: Attribute.Integer;
    height: Attribute.Integer;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    ext: Attribute.String;
    mime: Attribute.String & Attribute.Required;
    size: Attribute.Decimal & Attribute.Required;
    url: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    singularName: 'folder';
    pluralName: 'folders';
    displayName: 'Folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    singularName: 'release';
    pluralName: 'releases';
    displayName: 'Release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    scheduledAt: Attribute.DateTime;
    timezone: Attribute.String;
    status: Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Attribute.Required;
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    singularName: 'release-action';
    pluralName: 'release-actions';
    displayName: 'Release Action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    entry: Attribute.Relation<
      'plugin::content-releases.release-action',
      'morphToOne'
    >;
    contentType: Attribute.String & Attribute.Required;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    isEntryValid: Attribute.Boolean;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    name: 'permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    name: 'role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    description: Attribute.String;
    type: Attribute.String & Attribute.Unique;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    name: 'user';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Attribute.String;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    level: Attribute.Integer & Attribute.DefaultTo<1>;
    favorites: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::favorite.favorite'
    >;
    watchlaters: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::watchlater.watchlater'
    >;
    reports: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::report.report'
    >;
    comments: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::comment.comment'
    >;
    likes: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::comment.comment'
    >;
    reactions: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::reaction.reaction'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiAccountAccount extends Schema.CollectionType {
  collectionName: 'accounts';
  info: {
    singularName: 'account';
    pluralName: 'accounts';
    displayName: 'account';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    player: Attribute.Relation<
      'api::account.account',
      'manyToOne',
      'api::player.player'
    >;
    api_key: Attribute.String;
    username: Attribute.String;
    password: Attribute.String;
    up_available: Attribute.String;
    email: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::account.account',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::account.account',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCategoryCategory extends Schema.CollectionType {
  collectionName: 'categories';
  info: {
    singularName: 'category';
    pluralName: 'categories';
    displayName: 'category';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    description: Attribute.String;
    icon: Attribute.String;
    url: Attribute.String;
    image: Attribute.Relation<
      'api::category.category',
      'oneToOne',
      'api::image.image'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::category.category',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::category.category',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCommentComment extends Schema.CollectionType {
  collectionName: 'comments';
  info: {
    singularName: 'comment';
    pluralName: 'comments';
    displayName: 'comment';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Attribute.Text;
    comment_type: Attribute.String;
    content_id: Attribute.Integer;
    author: Attribute.Relation<
      'api::comment.comment',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    likes: Attribute.Integer;
    liked_by: Attribute.Relation<
      'api::comment.comment',
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    is_edited: Attribute.Boolean;
    is_deleted: Attribute.Boolean;
    parent: Attribute.Relation<
      'api::comment.comment',
      'oneToMany',
      'api::comment.comment'
    >;
    reply: Attribute.Relation<
      'api::comment.comment',
      'manyToOne',
      'api::comment.comment'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::comment.comment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::comment.comment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiEpisodeEpisode extends Schema.CollectionType {
  collectionName: 'episodes';
  info: {
    singularName: 'episode';
    pluralName: 'episodes';
    displayName: 'episode';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    episode_number: Attribute.Integer;
    hasCustomScreenshot: Attribute.Boolean;
    image: Attribute.Relation<
      'api::episode.episode',
      'manyToOne',
      'api::image.image'
    >;
    visible: Attribute.Boolean;
    serie: Attribute.Relation<
      'api::episode.episode',
      'manyToOne',
      'api::serie.serie'
    >;
    players: Attribute.Text;
    downloads: Attribute.Text;
    isNew: Attribute.Boolean;
    reports: Attribute.Relation<
      'api::episode.episode',
      'oneToMany',
      'api::report.report'
    >;
    uploader_sessions: Attribute.Relation<
      'api::episode.episode',
      'oneToMany',
      'api::uploader-session.uploader-session'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::episode.episode',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::episode.episode',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFavoriteFavorite extends Schema.CollectionType {
  collectionName: 'favorites';
  info: {
    singularName: 'favorite';
    pluralName: 'favorites';
    displayName: 'favorite';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    user: Attribute.Relation<
      'api::favorite.favorite',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    serie: Attribute.Relation<
      'api::favorite.favorite',
      'manyToOne',
      'api::serie.serie'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::favorite.favorite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::favorite.favorite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiGenreGenre extends Schema.CollectionType {
  collectionName: 'genres';
  info: {
    singularName: 'genre';
    pluralName: 'genres';
    displayName: 'genre';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    url: Attribute.String;
    series: Attribute.Relation<
      'api::genre.genre',
      'manyToMany',
      'api::serie.serie'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::genre.genre',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::genre.genre',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiImageImage extends Schema.CollectionType {
  collectionName: 'images';
  info: {
    singularName: 'image';
    pluralName: 'images';
    displayName: 'image';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    path: Attribute.String;
    image_type: Attribute.Relation<
      'api::image.image',
      'manyToOne',
      'api::image-type.image-type'
    >;
    series: Attribute.Relation<
      'api::image.image',
      'manyToMany',
      'api::serie.serie'
    >;
    placeholder: Attribute.String;
    episodes: Attribute.Relation<
      'api::image.image',
      'oneToMany',
      'api::episode.episode'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::image.image',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::image.image',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiImageTypeImageType extends Schema.CollectionType {
  collectionName: 'image_types';
  info: {
    singularName: 'image-type';
    pluralName: 'image-types';
    displayName: 'image_type';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    images: Attribute.Relation<
      'api::image-type.image-type',
      'oneToMany',
      'api::image.image'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::image-type.image-type',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::image-type.image-type',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiLanguageLanguage extends Schema.CollectionType {
  collectionName: 'languages';
  info: {
    singularName: 'language';
    pluralName: 'languages';
    displayName: 'language';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    series: Attribute.Relation<
      'api::language.language',
      'oneToMany',
      'api::serie.serie'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::language.language',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::language.language',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPlayerPlayer extends Schema.CollectionType {
  collectionName: 'players';
  info: {
    singularName: 'player';
    pluralName: 'players';
    displayName: 'player';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    short_name: Attribute.String;
    player_code: Attribute.String;
    active: Attribute.Boolean & Attribute.DefaultTo<true>;
    accounts: Attribute.Relation<
      'api::player.player',
      'oneToMany',
      'api::account.account'
    >;
    up_available: Attribute.Boolean;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::player.player',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::player.player',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProducerProducer extends Schema.CollectionType {
  collectionName: 'producers';
  info: {
    singularName: 'producer';
    pluralName: 'producers';
    displayName: 'producer';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    series: Attribute.Relation<
      'api::producer.producer',
      'oneToMany',
      'api::serie.serie'
    >;
    studios: Attribute.Relation<
      'api::producer.producer',
      'manyToMany',
      'api::studio.studio'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::producer.producer',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::producer.producer',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiRatingRating extends Schema.CollectionType {
  collectionName: 'ratings';
  info: {
    singularName: 'rating';
    pluralName: 'ratings';
    displayName: 'rating';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    value: Attribute.Integer;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::rating.rating',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::rating.rating',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiReactionReaction extends Schema.CollectionType {
  collectionName: 'reactions';
  info: {
    singularName: 'reaction';
    pluralName: 'reactions';
    displayName: 'reaction';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    reaction_type: Attribute.Enumeration<
      ['like', 'love', 'wow', 'dislike', 'sad']
    >;
    entity_type: Attribute.String;
    content_id: Attribute.Integer;
    user: Attribute.Relation<
      'api::reaction.reaction',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::reaction.reaction',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::reaction.reaction',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiReportReport extends Schema.CollectionType {
  collectionName: 'reports';
  info: {
    singularName: 'report';
    pluralName: 'reports';
    displayName: 'report';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    reason: Attribute.String;
    details: Attribute.String;
    episode: Attribute.Relation<
      'api::report.report',
      'manyToOne',
      'api::episode.episode'
    >;
    user: Attribute.Relation<
      'api::report.report',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    fixed: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::report.report',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::report.report',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiRrssRrss extends Schema.CollectionType {
  collectionName: 'rrsses';
  info: {
    singularName: 'rrss';
    pluralName: 'rrsses';
    displayName: 'rrss';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    url: Attribute.String;
    active: Attribute.Boolean;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::rrss.rrss', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::rrss.rrss', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiSerieSerie extends Schema.CollectionType {
  collectionName: 'series';
  info: {
    singularName: 'serie';
    pluralName: 'series';
    displayName: 'serie';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    title: Attribute.String;
    title_english: Attribute.String;
    synopsis: Attribute.Text;
    censorship: Attribute.Boolean;
    next_episode: Attribute.String;
    visits: Attribute.Integer;
    featured: Attribute.Boolean;
    hasEpisodes: Attribute.Boolean;
    status: Attribute.Relation<
      'api::serie.serie',
      'manyToOne',
      'api::status.status'
    >;
    serie_type: Attribute.Relation<
      'api::serie.serie',
      'manyToOne',
      'api::serie-type.serie-type'
    >;
    images: Attribute.Relation<
      'api::serie.serie',
      'manyToMany',
      'api::image.image'
    >;
    language: Attribute.Relation<
      'api::serie.serie',
      'manyToOne',
      'api::language.language'
    >;
    episodes: Attribute.Relation<
      'api::serie.serie',
      'oneToMany',
      'api::episode.episode'
    >;
    h_id: Attribute.String;
    genres: Attribute.Text;
    genreList: Attribute.Relation<
      'api::serie.serie',
      'manyToMany',
      'api::genre.genre'
    >;
    favorites: Attribute.Relation<
      'api::serie.serie',
      'oneToMany',
      'api::favorite.favorite'
    >;
    url: Attribute.String;
    watchlaters: Attribute.Relation<
      'api::serie.serie',
      'oneToMany',
      'api::watchlater.watchlater'
    >;
    studio: Attribute.Relation<
      'api::serie.serie',
      'manyToOne',
      'api::studio.studio'
    >;
    producer: Attribute.Relation<
      'api::serie.serie',
      'manyToOne',
      'api::producer.producer'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::serie.serie',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::serie.serie',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiSerieTypeSerieType extends Schema.CollectionType {
  collectionName: 'serie_types';
  info: {
    singularName: 'serie-type';
    pluralName: 'serie-types';
    displayName: 'serie_type';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    series: Attribute.Relation<
      'api::serie-type.serie-type',
      'oneToMany',
      'api::serie.serie'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::serie-type.serie-type',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::serie-type.serie-type',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiStatusStatus extends Schema.CollectionType {
  collectionName: 'statuses';
  info: {
    singularName: 'status';
    pluralName: 'statuses';
    displayName: 'status';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    series: Attribute.Relation<
      'api::status.status',
      'oneToMany',
      'api::serie.serie'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::status.status',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::status.status',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiStudioStudio extends Schema.CollectionType {
  collectionName: 'studios';
  info: {
    singularName: 'studio';
    pluralName: 'studios';
    displayName: 'studio';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    series: Attribute.Relation<
      'api::studio.studio',
      'oneToMany',
      'api::serie.serie'
    >;
    producers: Attribute.Relation<
      'api::studio.studio',
      'manyToMany',
      'api::producer.producer'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::studio.studio',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::studio.studio',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiUploaderSessionUploaderSession
  extends Schema.CollectionType {
  collectionName: 'uploader_sessions';
  info: {
    singularName: 'uploader-session';
    pluralName: 'uploader-sessions';
    displayName: 'uploader_session';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    episode: Attribute.Relation<
      'api::uploader-session.uploader-session',
      'manyToOne',
      'api::episode.episode'
    >;
    file_name: Attribute.String;
    status: Attribute.Enumeration<
      ['pending', 'uploading', 'finished', 'failed']
    > &
      Attribute.DefaultTo<'pending'>;
    services: Attribute.JSON;
    started_at: Attribute.DateTime;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::uploader-session.uploader-session',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::uploader-session.uploader-session',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiWatchlaterWatchlater extends Schema.CollectionType {
  collectionName: 'watchlaters';
  info: {
    singularName: 'watchlater';
    pluralName: 'watchlaters';
    displayName: 'watchlater';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    user: Attribute.Relation<
      'api::watchlater.watchlater',
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    serie: Attribute.Relation<
      'api::watchlater.watchlater',
      'manyToOne',
      'api::serie.serie'
    >;
    episode_number: Attribute.Integer;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::watchlater.watchlater',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::watchlater.watchlater',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::permission': AdminPermission;
      'admin::user': AdminUser;
      'admin::role': AdminRole;
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
      'api::account.account': ApiAccountAccount;
      'api::category.category': ApiCategoryCategory;
      'api::comment.comment': ApiCommentComment;
      'api::episode.episode': ApiEpisodeEpisode;
      'api::favorite.favorite': ApiFavoriteFavorite;
      'api::genre.genre': ApiGenreGenre;
      'api::image.image': ApiImageImage;
      'api::image-type.image-type': ApiImageTypeImageType;
      'api::language.language': ApiLanguageLanguage;
      'api::player.player': ApiPlayerPlayer;
      'api::producer.producer': ApiProducerProducer;
      'api::rating.rating': ApiRatingRating;
      'api::reaction.reaction': ApiReactionReaction;
      'api::report.report': ApiReportReport;
      'api::rrss.rrss': ApiRrssRrss;
      'api::serie.serie': ApiSerieSerie;
      'api::serie-type.serie-type': ApiSerieTypeSerieType;
      'api::status.status': ApiStatusStatus;
      'api::studio.studio': ApiStudioStudio;
      'api::uploader-session.uploader-session': ApiUploaderSessionUploaderSession;
      'api::watchlater.watchlater': ApiWatchlaterWatchlater;
    }
  }
}
