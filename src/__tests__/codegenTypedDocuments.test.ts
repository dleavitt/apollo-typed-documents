import { codegen } from "@graphql-codegen/core";
import { Types } from "@graphql-codegen/plugin-helpers";
import { buildSchema, parse, printSchema } from "graphql";

import * as codegenTypedDocuments from "../codegenTypedDocuments";

const schema = buildSchema(`
  type Author {
    idField: ID!
  }

  type Query {
    authors: [Author]
  }

  type Mutation {
    createAuthor: Author!
  }

  schema {
    query: Query
    mutation: Mutation
  }
`);

const getConfig = (
  options: Partial<Types.GenerateOptions> = {}
): Types.GenerateOptions => ({
  filename: "not-relevant",
  schema: parse(printSchema(schema)),
  plugins: [{ codegenTypedDocuments: { typesModule: "@codegen-types" } }],
  pluginMap: { codegenTypedDocuments },
  config: {},
  documents: [],
  ...options,
});

describe("codegenTypedDocuments", () => {
  it("should not have any output when there are no documents", async () => {
    const config = getConfig();
    const output = await codegen(config);

    expect(output).toMatchInlineSnapshot(`""`);
  });

  it("should have ambient module declarations for each document", async () => {
    const queryDocument = parse(`
      query authors {
        authors {
          idField
        }
      }
    `);

    const mutationDocument = parse(`
      mutation createAuthor {
        createAuthor {
          idField
        }
      }
    `);

    const documents = [
      { document: queryDocument, location: "authors.gql" },
      { document: mutationDocument, location: "createAuthor.gql" },
    ];

    const config = getConfig({ documents });
    const output = await codegen(config);

    expect(output).toMatchInlineSnapshot(`
      "declare module \\"*/authors.gql\\" {
        import { TypedDocumentNode } from \\"apollo-typed-documents\\";
        import { AuthorsQuery, AuthorsQueryVariables } from \\"@codegen-types\\";
        export const authors: TypedDocumentNode<AuthorsQueryVariables, AuthorsQuery>;
        export default authors;
      }

      declare module \\"*/createAuthor.gql\\" {
        import { TypedDocumentNode } from \\"apollo-typed-documents\\";
        import { CreateAuthorMutation, CreateAuthorMutationVariables } from \\"@codegen-types\\";
        export const createAuthor: TypedDocumentNode<CreateAuthorMutationVariables, CreateAuthorMutation>;
        export default createAuthor;
      }"
    `);
  });

  it("should not have default exports for multiple operations", async () => {
    const queryDocument = parse(`
      query authors {
        authors {
          idField
        }
      }
      query alsoAuthors {
        authors {
          idField
        }
      }
    `);

    const mutationDocument = parse(`
      mutation createAuthor {
        createAuthor {
          idField
        }
      }
      mutation alsoCreateAuthor {
        createAuthor {
          idField
        }
      }
    `);

    const documents = [
      { document: queryDocument, location: "authors.gql" },
      { document: mutationDocument, location: "createAuthor.gql" },
    ];

    const config = getConfig({ documents });
    const output = await codegen(config);

    expect(output).toMatchInlineSnapshot(`
      "declare module \\"*/authors.gql\\" {
        import { TypedDocumentNode } from \\"apollo-typed-documents\\";
        import { AuthorsQuery, AuthorsQueryVariables } from \\"@codegen-types\\";
        export const authors: TypedDocumentNode<AuthorsQueryVariables, AuthorsQuery>;
        import { AlsoAuthorsQuery, AlsoAuthorsQueryVariables } from \\"@codegen-types\\";
        export const alsoAuthors: TypedDocumentNode<AlsoAuthorsQueryVariables, AlsoAuthorsQuery>;
      }

      declare module \\"*/createAuthor.gql\\" {
        import { TypedDocumentNode } from \\"apollo-typed-documents\\";
        import { CreateAuthorMutation, CreateAuthorMutationVariables } from \\"@codegen-types\\";
        export const createAuthor: TypedDocumentNode<CreateAuthorMutationVariables, CreateAuthorMutation>;
        import { AlsoCreateAuthorMutation, AlsoCreateAuthorMutationVariables } from \\"@codegen-types\\";
        export const alsoCreateAuthor: TypedDocumentNode<AlsoCreateAuthorMutationVariables, AlsoCreateAuthorMutation>;
      }"
    `);
  });

  describe("module path customization", () => {
    const queryDocument = parse(`
      query authors {
        authors {
          idField
        }
      }
    `);

    const mutationDocument = parse(`
      mutation createAuthor {
        createAuthor {
          idField
        }
      }
    `);

    const documents = [
      { document: queryDocument, location: "literary/types/authors.gql" },
      { document: mutationDocument, location: "mutations/createAuthor.gql" },
    ];

    const getPathConfig = (pluginConfig: Record<string, unknown>) => {
      return getConfig({
        documents,
        plugins: [
          {
            codegenTypedDocuments: {
              typesModule: "@codegen-types",
              ...pluginConfig,
            },
          },
        ],
      });
    };

    it("wildcards the basename by default", async () => {
      const config = getPathConfig({});
      const output = await codegen(config);

      expect(output).toMatchInlineSnapshot(`
        "declare module \\"*/authors.gql\\" {
          import { TypedDocumentNode } from \\"apollo-typed-documents\\";
          import { AuthorsQuery, AuthorsQueryVariables } from \\"@codegen-types\\";
          export const authors: TypedDocumentNode<AuthorsQueryVariables, AuthorsQuery>;
          export default authors;
        }

        declare module \\"*/createAuthor.gql\\" {
          import { TypedDocumentNode } from \\"apollo-typed-documents\\";
          import { CreateAuthorMutation, CreateAuthorMutationVariables } from \\"@codegen-types\\";
          export const createAuthor: TypedDocumentNode<CreateAuthorMutationVariables, CreateAuthorMutation>;
          export default createAuthor;
        }"
      `);
    });

    it("respects the relativeToCwd setting", async () => {
      const config = getPathConfig({ relativeToCwd: true });
      const output = await codegen(config);

      expect(output).toEqual(
        expect.stringContaining(`declare module "*/literary/types/authors.gql"`)
      );
      expect(output).toEqual(
        expect.stringContaining(`declare module "*/mutations/createAuthor.gql"`)
      );
    });

    it("respects the prefix setting", async () => {
      const config = getPathConfig({ prefix: "gql/" });
      const output = await codegen(config);

      expect(output).toEqual(
        expect.stringContaining(`declare module "gql/authors.gql"`)
      );
      expect(output).toEqual(
        expect.stringContaining(`declare module "gql/createAuthor.gql"`)
      );
    });

    it("even respects the superfluous modulePathPrefix setting", async () => {
      const config = getPathConfig({ modulePathPrefix: "stuff/" });
      const output = await codegen(config);

      expect(output).toEqual(
        expect.stringContaining(`declare module "*/stuff/authors.gql"`)
      );
      expect(output).toEqual(
        expect.stringContaining(`declare module "*/stuff/createAuthor.gql"`)
      );
    });

    it("allows combining path settings", async () => {
      const config = getPathConfig({
        prefix: "",
        modulePathPrefix: "defs/",
        relativeToCwd: true,
      });

      const output = await codegen(config);

      expect(output).toEqual(
        expect.stringContaining(
          `declare module "defs/literary/types/authors.gql"`
        )
      );
      expect(output).toEqual(
        expect.stringContaining(
          `declare module "defs/mutations/createAuthor.gql"`
        )
      );
    });
  });
});
