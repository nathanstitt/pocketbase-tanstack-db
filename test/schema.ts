export interface Users {
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `password` |
     * | hidden   | `true`     |
     * | required | `true`     |
     * | min      | `8`        |
     */
    password: string
    /**
     * |                     |                   |
     * | ------------------- | ----------------- |
     * | type                | `text`            |
     * | hidden              | `true`            |
     * | required            | `true`            |
     * | min                 | `30`              |
     * | max                 | `60`              |
     * | autogeneratePattern | `[a-zA-Z0-9]{50}` |
     */
    tokenKey: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `email` |
     * | hidden   | `false` |
     * | required | `true`  |
     */
    email: string
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    emailVisibility: true
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    verified: boolean
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | max      | `255`   |
     */
    name: string
    /**
     * |           |                                                                       |
     * | --------- | --------------------------------------------------------------------- |
     * | type      | `file(single)`                                                        |
     * | hidden    | `false`                                                               |
     * | required  | `false`                                                               |
     * | protected | `false`                                                               |
     * | maxSize   | `0`                                                                   |
     * | mimeTypes | `image/jpeg`, `image/png`, `image/svg+xml`, `image/gif`, `image/webp` |
     */
    avatar: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `pbc_2100535537`   |
     * | collectionName | `orgs`             |
     * | cascadeDelete  | `true`             |
     */
    org: string
    /**
     * |          |                  |
     * | -------- | ---------------- |
     * | type     | `select(single)` |
     * | hidden   | `false`          |
     * | required | `true`           |
     */
    role: 'admin' | 'clerical' | 'workforce'
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}

export interface Orgs {
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | min      | `3`     |
     * | max      | `45`    |
     */
    name: string
    /**
     * |          |                              |
     * | -------- | ---------------------------- |
     * | type     | `text`                       |
     * | hidden   | `false`                      |
     * | required | `true`                       |
     * | min      | `3`                          |
     * | max      | `15`                         |
     * | pattern  | `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
     */
    slug: string
    /**
     * |                |                       |
     * | -------------- | --------------------- |
     * | type           | `relation (multiple)` |
     * | hidden         | `false`               |
     * | required       | `false`               |
     * | collectionId   | `_pb_users_auth_`     |
     * | collectionName | `users`               |
     * | cascadeDelete  | `false`               |
     * | maxSelect      | `999`                 |
     */
    users: string[]
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}

export interface Invitations {
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `email` |
     * | hidden   | `false` |
     * | required | `true`  |
     */
    email: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | min      | `1`     |
     * | max      | `255`   |
     */
    name: string
    /**
     * |                     |                  |
     * | ------------------- | ---------------- |
     * | type                | `text`           |
     * | hidden              | `false`          |
     * | required            | `true`           |
     * | min                 | `8`              |
     * | max                 | `8`              |
     * | pattern             | `^[a-zA-Z0-9]+$` |
     * | autogeneratePattern | `[a-zA-Z0-9]{8}` |
     */
    code: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `pbc_2100535537`   |
     * | collectionName | `orgs`             |
     * | cascadeDelete  | `false`            |
     */
    org: string
    /**
     * |          |                  |
     * | -------- | ---------------- |
     * | type     | `select(single)` |
     * | hidden   | `false`          |
     * | required | `true`           |
     */
    role: 'admin' | 'clerical' | 'workforce'
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `_pb_users_auth_`  |
     * | collectionName | `users`            |
     * | cascadeDelete  | `false`            |
     */
    invited_by: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `true`  |
     */
    expires_at: string
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    used: boolean
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}

export interface Customers {
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |          |                              |
     * | -------- | ---------------------------- |
     * | type     | `text`                       |
     * | hidden   | `false`                      |
     * | required | `true`                       |
     * | min      | `3`                          |
     * | max      | `15`                         |
     * | pattern  | `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
     */
    slug: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `false`            |
     * | collectionId   | `pbc_2100535537`   |
     * | collectionName | `orgs`             |
     * | cascadeDelete  | `false`            |
     */
    org: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     */
    name: string
    /**
     * |             |          |
     * | ----------- | -------- |
     * | type        | `editor` |
     * | hidden      | `false`  |
     * | required    | `false`  |
     * | convertURLs | `false`  |
     */
    notes: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `false`            |
     * | collectionId   | `pbc_199332750`    |
     * | collectionName | `addresses`        |
     * | cascadeDelete  | `true`             |
     */
    address: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}

export interface Addresses {
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    line1: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    line2: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    city: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    stateProvinceCounty: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    zipOrPostcode: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    country: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `pbc_2100535537`   |
     * | collectionName | `orgs`             |
     * | cascadeDelete  | `true`             |
     */
    org: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}

export interface Jobs {
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     * | min      | `3`     |
     * | max      | `15`    |
     */
    slug: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     */
    name: string
    /**
     * |             |          |
     * | ----------- | -------- |
     * | type        | `editor` |
     * | hidden      | `false`  |
     * | required    | `false`  |
     * | convertURLs | `false`  |
     */
    notes: string
    /**
     * |          |                  |
     * | -------- | ---------------- |
     * | type     | `select(single)` |
     * | hidden   | `false`          |
     * | required | `false`          |
     */
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELED' | 'PENDING'
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `false`            |
     * | collectionId   | `pbc_199332750`    |
     * | collectionName | `addresses`        |
     * | cascadeDelete  | `true`             |
     */
    address: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `false`            |
     * | collectionId   | `pbc_2100535537`   |
     * | collectionName | `orgs`             |
     * | cascadeDelete  | `false`            |
     */
    org: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    started: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    completed: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `false`            |
     * | collectionId   | `pbc_108570809`    |
     * | collectionName | `customers`        |
     * | cascadeDelete  | `false`            |
     */
    customer: string
    /**
     * |                |                       |
     * | -------------- | --------------------- |
     * | type           | `relation (multiple)` |
     * | hidden         | `false`               |
     * | required       | `false`               |
     * | collectionId   | `pbc_1219621782`      |
     * | collectionName | `tags`                |
     * | cascadeDelete  | `false`               |
     * | maxSelect      | `999`                 |
     */
    tags: string[]
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}

export interface Tags {
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |          |                              |
     * | -------- | ---------------------------- |
     * | type     | `text`                       |
     * | hidden   | `false`                      |
     * | required | `true`                       |
     * | min      | `3`                          |
     * | max      | `15`                         |
     * | pattern  | `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
     */
    name: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    description: string
    /**
     * |          |                                       |
     * | -------- | ------------------------------------- |
     * | type     | `text`                                |
     * | hidden   | `false`                               |
     * | required | `true`                                |
     * | pattern  | `^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$` |
     */
    color: string
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    inactive: boolean
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `false`            |
     * | collectionId   | `pbc_2100535537`   |
     * | collectionName | `orgs`             |
     * | cascadeDelete  | `false`            |
     */
    org: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}

export interface Locations {
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `pbc_2100535537`   |
     * | collectionName | `orgs`             |
     * | cascadeDelete  | `false`            |
     */
    org: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `pbc_2409499253`   |
     * | collectionName | `jobs`             |
     * | cascadeDelete  | `false`            |
     */
    job: string
    /**
     * |                |                       |
     * | -------------- | --------------------- |
     * | type           | `relation (multiple)` |
     * | hidden         | `false`               |
     * | required       | `false`               |
     * | collectionId   | `pbc_1219621782`      |
     * | collectionName | `tags`                |
     * | cascadeDelete  | `false`               |
     * | maxSelect      | `999`                 |
     */
    tags: string[]
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `true`  |
     */
    name: string
    /**
     * |             |          |
     * | ----------- | -------- |
     * | type        | `editor` |
     * | hidden      | `false`  |
     * | required    | `false`  |
     * | convertURLs | `false`  |
     */
    description: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `json`  |
     * | hidden   | `false` |
     * | maxSize  | `0`     |
     * | required | `false` |
     */
    geometry: any
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    inactive: boolean
    /**
     * |           |                |
     * | --------- | -------------- |
     * | type      | `file(single)` |
     * | hidden    | `false`        |
     * | required  | `false`        |
     * | protected | `false`        |
     * | maxSize   | `0`            |
     */
    thumbnail: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}

export interface Movement {
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `false`            |
     * | collectionId   | `_pb_users_auth_`  |
     * | collectionName | `users`            |
     * | cascadeDelete  | `true`             |
     */
    user: string
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `true`   |
     * | onlyInt  | `false`  |
     */
    latitude: number
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `true`   |
     * | onlyInt  | `false`  |
     */
    longitude: number
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `false`  |
     */
    position_accuracy: number
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `false`  |
     */
    heading: number
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `false`  |
     */
    heading_accuracy: number
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `false`  |
     */
    speed: number
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `false`  |
     */
    speed_accuracy: number
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    is_moving: boolean
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    movement_type: string
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `false`  |
     */
    battery_level: number
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    is_charging: boolean
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    timestamp: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `pbc_2100535537`   |
     * | collectionName | `orgs`             |
     * | cascadeDelete  | `true`             |
     */
    org: string
    /**
     * |          |                  |
     * | -------- | ---------------- |
     * | type     | `select(single)` |
     * | hidden   | `false`          |
     * | required | `false`          |
     */
    geofence_type: 'ENTER' | 'EXIT'
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    ref_id: string
}

export interface TimeEntries {
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `_pb_users_auth_`  |
     * | collectionName | `users`            |
     * | cascadeDelete  | `true`             |
     * | minSelect      | `1`                |
     */
    user: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `pbc_2100535537`   |
     * | collectionName | `orgs`             |
     * | cascadeDelete  | `true`             |
     * | minSelect      | `1`                |
     */
    org: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `pbc_2409499253`   |
     * | collectionName | `jobs`             |
     * | cascadeDelete  | `true`             |
     * | minSelect      | `1`                |
     */
    job: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `false`            |
     * | collectionId   | `pbc_859047449`    |
     * | collectionName | `locations`        |
     * | cascadeDelete  | `true`             |
     */
    location: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `true`  |
     */
    clock_in: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    clock_out: string
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `true`   |
     * | min      | `0`      |
     */
    duration: number
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    notes: string
    /**
     * |          |                  |
     * | -------- | ---------------- |
     * | type     | `select(single)` |
     * | hidden   | `false`          |
     * | required | `true`           |
     */
    status: 'active' | 'approved' | 'rejected' | 'pending'
    /**
     * |          |                  |
     * | -------- | ---------------- |
     * | type     | `select(single)` |
     * | hidden   | `false`          |
     * | required | `true`           |
     */
    entry_type: 'manual' | 'timer' | 'geofence'
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `json`  |
     * | hidden   | `false` |
     * | maxSize  | `0`     |
     * | required | `false` |
     */
    clock_in_location: any
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `json`  |
     * | hidden   | `false` |
     * | maxSize  | `0`     |
     * | required | `false` |
     */
    clock_out_location: any
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `false`  |
     * | onlyInt  | `true`   |
     * | min      | `0`      |
     */
    break_time: number
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `false`            |
     * | collectionId   | `_pb_users_auth_`  |
     * | collectionName | `users`            |
     * | cascadeDelete  | `false`            |
     */
    modified_by: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `false`            |
     * | collectionId   | `_pb_users_auth_`  |
     * | collectionName | `users`            |
     * | cascadeDelete  | `false`            |
     */
    approved_by: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `date`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    approved_at: string
    /**
     * |          |         |
     * | -------- | ------- |
     * | type     | `text`  |
     * | hidden   | `false` |
     * | required | `false` |
     */
    rejection_reason: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}

export interface Settings {
    /**
     * |                     |                |
     * | ------------------- | -------------- |
     * | type                | `text`         |
     * | hidden              | `false`        |
     * | required            | `true`         |
     * | min                 | `15`           |
     * | max                 | `15`           |
     * | pattern             | `^[a-z0-9]+$`  |
     * | autogeneratePattern | `[a-z0-9]{15}` |
     */
    id: string
    /**
     * |                |                    |
     * | -------------- | ------------------ |
     * | type           | `relation(single)` |
     * | hidden         | `false`            |
     * | required       | `true`             |
     * | collectionId   | `pbc_2100535537`   |
     * | collectionName | `orgs`             |
     * | cascadeDelete  | `true`             |
     * | minSelect      | `1`                |
     */
    org: string
    /**
     * |        |         |
     * | ------ | ------- |
     * | type   | `bool`  |
     * | hidden | `false` |
     */
    auto_approve_geo_entries: boolean
    /**
     * |          |                  |
     * | -------- | ---------------- |
     * | type     | `select(single)` |
     * | hidden   | `false`          |
     * | required | `true`           |
     */
    period_type: 'weekly' | 'biweekly_even' | 'biweekly_odd' | 'semi_monthly' | 'monthly'
    /**
     * |          |          |
     * | -------- | -------- |
     * | type     | `number` |
     * | hidden   | `false`  |
     * | required | `true`   |
     * | onlyInt  | `false`  |
     * | min      | `0`      |
     * | max      | `6`      |
     */
    week_start_day: number
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `false`    |
     */
    created: string
    /**
     * |          |            |
     * | -------- | ---------- |
     * | type     | `autodate` |
     * | hidden   | `false`    |
     * | onCreate | `true`     |
     * | onUpdate | `true`     |
     */
    updated: string
}


/**
 * Commented-out back-relations are what will be inferred by pocketbase-ts from the forward relations.
 *
 * The "UNIQUE index constraint" case is automatically handled by this hook,
 * but if you want to make a back-relation non-nullable, you can uncomment it and remove the "?".
 *
 * See [here](https://github.com/satohshi/pocketbase-ts#back-relations) for more information.
 */
export type Schema = {
    users: {
        type: Users
        relations: {
            org: Orgs
            // orgs_via_users?: Orgs[]
            // invitations_via_invited_by?: Invitations[]
            // movement_via_user?: Movement[]
            // time_entries_via_user?: TimeEntries[]
            // time_entries_via_modified_by?: TimeEntries[]
            // time_entries_via_approved_by?: TimeEntries[]
        }
    }
    orgs: {
        type: Orgs
        relations: {
            // users_via_org?: Users[]
            users?: Users[]
            // invitations_via_org?: Invitations[]
            // customers_via_org?: Customers[]
            // addresses_via_org?: Addresses[]
            // jobs_via_org?: Jobs[]
            // tags_via_org?: Tags[]
            // locations_via_org?: Locations[]
            // movement_via_org?: Movement[]
            // time_entries_via_org?: TimeEntries[]
            settings_via_org?: Settings
        }
    }
    invitations: {
        type: Invitations
        relations: {
            org: Orgs
            invited_by: Users
        }
    }
    customers: {
        type: Customers
        relations: {
            org?: Orgs
            address?: Addresses
            // jobs_via_customer?: Jobs[]
        }
    }
    addresses: {
        type: Addresses
        relations: {
            // customers_via_address?: Customers[]
            org: Orgs
            // jobs_via_address?: Jobs[]
        }
    }
    jobs: {
        type: Jobs
        relations: {
            address?: Addresses
            org?: Orgs
            customer?: Customers
            tags?: Tags[]
            // locations_via_job?: Locations[]
            // time_entries_via_job?: TimeEntries[]
        }
    }
    tags: {
        type: Tags
        relations: {
            // jobs_via_tags?: Jobs[]
            org?: Orgs
            // locations_via_tags?: Locations[]
        }
    }
    locations: {
        type: Locations
        relations: {
            org: Orgs
            job: Jobs
            tags?: Tags[]
            // time_entries_via_location?: TimeEntries[]
        }
    }
    movement: {
        type: Movement
        relations: {
            user?: Users
            org: Orgs
        }
    }
    time_entries: {
        type: TimeEntries
        relations: {
            user: Users
            org: Orgs
            job: Jobs
            location?: Locations
            modified_by?: Users
            approved_by?: Users
        }
    }
    settings: {
        type: Settings
        relations: {
            org: Orgs
        }
    }
}

