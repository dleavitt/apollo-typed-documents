# apollo-typed-documents

Provides graphql-codegen plugins (https://graphql-code-generator.com/) for type safe GraphQL documents (`DocumentNode`).

It allows functions to accept a generic `TypedDocumentNode<TVariables, TData>` so that types of other arguments or the return type can be inferred.

It is helpful for TypeScript projects but also if used only within an IDE, e.g. it works extremely well with VSCode (uses TypeScript behind the scenes).

```sh
$ yarn add apollo-typed-documents
```

## codegenTypedDocuments

Generates TypeScript typings for `.graphql` files.

Similar to `@graphql-codegen/typescript-graphql-files-modules` (https://graphql-code-generator.com/docs/plugins/typescript-graphql-files-modules).

The difference is that is uses generic types, so that you have type safety with Apollo (e.g. `useQuery` / `useMutation`).

### Install

```sh
$ yarn add @graphql-codegen/add @graphql-codegen/typescript @graphql-codegen/typescript-operations
$ yarn add apollo-typed-documents
```

`codegen.yml`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/codegenTypedDocuments.yml) -->
<!-- The below code snippet is automatically added from ./examples/docs/codegenTypedDocuments.yml -->
```yml
schema: schema.graphql
documents: src/**/*.graphql
generates:
  ./src/codegenTypedDocuments.d.ts:
    plugins:
      - apollo-typed-documents/lib/codegenTypedDocuments
    config:
      typesModule: "@codegen-types"
  ./src/codegenTypes.d.ts:
    plugins:
      - add: 'declare module "@codegen-types" {'
      - add:
          placement: append
          content: "}"
      - typescript
      - typescript-operations
```
<!-- AUTO-GENERATED-CONTENT:END -->

`tsconfig.json`:

Add `node_modules/apollo-typed-documents/lib/reactHooks.d.ts` in `include` to override the typings for `@apollo/react-hooks`, so that types can be inferred from typed documents.

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/tsconfig.json) -->
<!-- The below code snippet is automatically added from ./examples/docs/tsconfig.json -->
```json
{
  "compilerOptions": {
    "noEmit": true,
    "allowJs": true,
    "checkJs": true,
    "strict": true,
    "jsx": "react",
    "esModuleInterop": true
  },
  "include": ["src", "node_modules/apollo-typed-documents/lib/reactHooks.d.ts"]
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

### Example

`src/authors.graphql`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/src/authors.graphql) -->
<!-- The below code snippet is automatically added from ./examples/docs/src/authors.graphql -->
```graphql
query authors {
  authors {
    id
    name
    description
    books {
      id
      title
    }
  }
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

`src/createAuthor.graphql`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/src/createAuthor.graphql) -->
<!-- The below code snippet is automatically added from ./examples/docs/src/createAuthor.graphql -->
```graphql
mutation createAuthor($input: AuthorInput!) {
  createAuthor(input: $input) {
    id
    name
    description
    books {
      id
      title
    }
  }
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

`src/codegenTypedDocuments.d.ts` (generated):

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/src/codegenTypedDocuments.d.ts) -->
<!-- The below code snippet is automatically added from ./examples/docs/src/codegenTypedDocuments.d.ts -->
```ts
declare module "*/authors.graphql" {
  import { TypedDocumentNode } from "apollo-typed-documents";
  import { AuthorsQuery, AuthorsQueryVariables } from "@codegen-types";
  export const authors: TypedDocumentNode<AuthorsQueryVariables, AuthorsQuery>;
  export default authors;
}

declare module "*/createAuthor.graphql" {
  import { TypedDocumentNode } from "apollo-typed-documents";
  import { CreateAuthorMutation, CreateAuthorMutationVariables } from "@codegen-types";
  export const createAuthor: TypedDocumentNode<CreateAuthorMutationVariables, CreateAuthorMutation>;
  export default createAuthor;
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

`src/AuthorList.js`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/src/AuthorList.js) -->
<!-- The below code snippet is automatically added from ./examples/docs/src/AuthorList.js -->
```js
import { useMutation, useQuery } from "@apollo/react-hooks";
import React from "react";

import authorsQuery from "./authors.graphql";
import createAuthorMutation from "./createAuthor.graphql";

const AuthorList = () => {
  // Type of `data` is inferred (AuthorsQuery)
  const { data } = useQuery(authorsQuery);
  const [createAuthor] = useMutation(createAuthorMutation);

  return (
    <>
      <ul>
        {data?.authors.map((author) => (
          <li key={author.id}>{author.name}</li>
        ))}
      </ul>
      <button
        onClick={() => {
          createAuthor({
            // Type of variables is inferred (CreateAuthorMutationVariables)
            variables: { input: { name: "Foo", books: [{ title: "Bar" }] } },
          });
        }}
      >
        Add
      </button>
    </>
  );
};

export default AuthorList;
```
<!-- AUTO-GENERATED-CONTENT:END -->

### Notes for `create-react-app` users

`create-react-app` supports `graphql.macro` for loading `.graphql` files (https://create-react-app.dev/docs/loading-graphql-files/).

The `codegenTypedDocuments` plugin generates ambient module declarations for `.graphql` files, which means that `.graphql` files must be imported as regular modules (`import` syntax) so that TypeScript knows about the types.

You can use the babel plugin `babel-plugin-import-graphql` (https://github.com/detrohutt/babel-plugin-import-graphql), but then you need to use `react-app-rewired` (https://github.com/timarney/react-app-rewired/) and `customize-cra` (https://github.com/arackaf/customize-cra) so that you can define custom babel plugins.

```sh
$ yarn add react-app-rewired customize-cra
$ yarn add babel-plugin-import-graphql
```

`config-overrides.js`

```js
const { override, useBabelRc } = require("customize-cra");

module.exports = override(useBabelRc());
```

`.babelrc`

```json
{
  "presets": ["react-app"],
  "plugins": ["babel-plugin-import-graphql"]
}
```

`package.json`

```js
"scripts": {
  "start": "react-app-rewired start",
  "build": "react-app-rewired build",
  "test": "react-app-rewired test",
  ...
}
```

If you have a TypeScript app, you need to override the `@apollo/react-hooks` types in `tsconfig.json`:

`tsconfig.json`

```js
{
  "compilerOptions": {
    ...
  },
  "include": ["src", "node_modules/apollo-typed-documents/lib/reactHooks.d.ts"]
}
```

If you don't have a TypeScript app (you just want TypeScript support within your IDE) you can't create a `tsconfig.json` in your app folder, because `create-react-app` uses that file to detect if this is a TypeScript project.

Instead, you have to create the `tsconfig.json` in your `src` folder:

`src/tsconfig.json`

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/cra/src/tsconfig.json) -->
<!-- The below code snippet is automatically added from ./examples/cra/src/tsconfig.json -->
```json
{
  "compilerOptions": {
    "noEmit": true,
    "allowJs": true,
    "checkJs": true,
    "strict": true,
    "jsx": "react",
    "esModuleInterop": true
  },
  "include": [".", "../node_modules/apollo-typed-documents/lib/reactHooks.d.ts"]
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

Please see the following example projects for more details:

- [`create-react-app` with TypeScript](examples/cra-ts)
- [`create-react-app` without TypeScript](examples/cra)

## codegenApolloMock

Creates a helper method to easily create mocks for Apollo `MockedProvider` (https://www.apollographql.com/docs/react/api/react-testing/#mockedprovider).

The returned object is guaranteed to conform to the GraphQL Schema of the query / mutation: [reference](src/createApolloMock.ts).

For required (non-null) fields which are not provided (in data / variables), it will use a default value (e.g. `"Author-id"`).

For optional fields which are not provided (in data / variables), it will use `undefined` for variables and `null` for data.

Works for any nested selections (data) and any nested inputs (variables).

It will include `__typename` in data by default. This can be deactivated as an option:

```js
apolloMock(documentNode, variables, data, { addTypename: false });
```

When used together with `codegenTypedDocuments` the data and variables are type checked (type inference).

### Install

```sh
$ yarn add apollo-typed-documents
```

`codegen.yml`

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/codegenApolloMock.yml) -->
<!-- The below code snippet is automatically added from ./examples/docs/codegenApolloMock.yml -->
```yml
schema: schema.graphql
documents: src/**/*.graphql
generates:
  ./src/apolloMock.js:
    plugins:
      - apollo-typed-documents/lib/codegenApolloMock
```
<!-- AUTO-GENERATED-CONTENT:END -->

### Example

`schema.graphql`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/schema.graphql) -->
<!-- The below code snippet is automatically added from ./examples/docs/schema.graphql -->
```graphql
type Author {
  id: ID!
  name: String!
  description: String
  books: [Book!]!
}

type Book {
  id: ID!
  title: String!
}

input AuthorInput {
  name: String!
  description: String
  books: [BookInput!]!
}

input BookInput {
  title: String!
}

type Query {
  authors: [Author!]!
}

type Mutation {
  createAuthor(input: AuthorInput!): Author!
}

schema {
  query: Query
  mutation: Mutation
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

`src/authors.graphql`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/src/authors.graphql) -->
<!-- The below code snippet is automatically added from ./examples/docs/src/authors.graphql -->
```graphql
query authors {
  authors {
    id
    name
    description
    books {
      id
      title
    }
  }
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

`src/createAuthor.graphql`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/src/createAuthor.graphql) -->
<!-- The below code snippet is automatically added from ./examples/docs/src/createAuthor.graphql -->
```graphql
mutation createAuthor($input: AuthorInput!) {
  createAuthor(input: $input) {
    id
    name
    description
    books {
      id
      title
    }
  }
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

`src/apolloMock.js` (generated):

See: [reference](examples/docs/src/apolloMock.js)

`src/apolloMock.test.js`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./examples/docs/src/apolloMock.test.js) -->
<!-- The below code snippet is automatically added from ./examples/docs/src/apolloMock.test.js -->
```js
import apolloMock from "./apolloMock";
import authors from "./authors.graphql";
import createAuthor from "./createAuthor.graphql";

describe("apolloMock", () => {
  it("produces the minimal output that is valid according to graphql schema", () => {
    expect(apolloMock(authors, {}, {})).toEqual({
      request: {
        query: authors,
        variables: {},
      },
      result: {
        data: {
          authors: [],
        },
      },
    });

    expect(apolloMock(authors, {}, { authors: [{}] })).toEqual({
      request: {
        query: authors,
        variables: {},
      },
      result: {
        data: {
          authors: [
            {
              __typename: "Author",
              id: "Author-id",
              name: "Author-name",
              description: null,
              books: [],
            },
          ],
        },
      },
    });

    expect(
      apolloMock(
        createAuthor,
        { input: { name: "Foo", books: [{ title: "Bar" }] } },
        { createAuthor: { name: "Foo", books: [{ title: "Bar" }] } }
      )
    ).toEqual({
      request: {
        query: createAuthor,
        variables: {
          input: {
            name: "Foo",
            description: undefined,
            books: [{ title: "Bar" }],
          },
        },
      },
      result: {
        data: {
          createAuthor: {
            __typename: "Author",
            id: "Author-id",
            name: "Foo",
            description: null,
            books: [
              {
                __typename: "Book",
                id: "Book-id",
                title: "Bar",
              },
            ],
          },
        },
      },
    });
  });
});
```
<!-- AUTO-GENERATED-CONTENT:END -->