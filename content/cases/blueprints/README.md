# Patient scaffold requests

Use a scaffold request to create a mechanically playable, medically unreviewed patient in `content/cases/review/`:

```sh
pnpm content:draft content/cases/blueprints/basic-mdd-scaffold.example.json
pnpm content:compile
pnpm dev
```

Then open Developer mode. Vite discovers every `*.case.json` in the review folder; restart the development server after adding a new file.

The scaffolder is deliberately conservative. It changes neutral presentation variation, internal IDs, age range, and source-use metadata while inheriting executable clinical rules from the selected approved template. It does **not** infer a new diagnosis or propagate article text into scoring. Each generated package includes blocking clinical-review tickets for the inherited logic and source application. Edit and resolve those proposals before any promotion.

For a source-backed request, run `pnpm content:scan` and `pnpm content:extract` first, inspect IDs with `pnpm content:review`, then populate `sourceUses` with exact document/chunk IDs and an original concise takeaway. Raw text remains under the gitignored source-document boundary. The tracked example is source-free so a clean checkout can exercise the mechanics without private files.
