---
name: sort-imports
description: Sort TypeScript import statements in a file by line length and wrap any line exceeding 120 characters. Use when asked to sort imports, organise imports, or fix import order/formatting.
---

Sort the imports in: $ARGUMENTS

If no file is given, ask which file to sort, or infer it from the current conversation context.

## Algorithm

### Step 1 - Read the File

Read the target file in full.

### Step 2 - Extract the Import Block

Collect every line that belongs to an `import` statement at the top of the file. A block ends at the first line that is not blank and does not start with `import`.

Multi-line imports (imports already broken across lines) must be normalized to a single line before sorting. Collect all continuation lines until the semicolon is found, then join them into one line:

```ts
import {
   Foo,
   Bar,
} from '../some/module';

// becomes:
import { Foo, Bar } from '../some/module';
```

Remove extra whitespace between `{`, `,`, and `}` when joining.

### Step 3 - Determine Sort Direction

- Default: short -> long (ascending by character count of the single-line form)
- If the argument includes `--desc`: long -> short (descending)

When two imports have the same length, sort alphabetically by module path (the string after `from`).

### Step 4 - Wrap Lines >= 120 Characters

After sorting, check each import in its single-line form. If `len >= 120`, reformat it as multi-line using 3-space indent:

```ts
import {
   VeryLongExportNameThatAloneBreaksTheLimit,
} from '../some/very/deeply/nested/path/that/is/long';
```

```ts
import {
   FirstExport,
   SecondExport,
   ThirdExport,
} from '../path/to/module';
```

Rules:

- Opening `{` stays on the `import` line
- Each named export on its own line, 3-space indent, trailing comma on every item
- Closing `}` and `from 'path';` stay on the same line
- For sorting only, use the single-line form length

### Step 5 - Rewrite the File

Replace only the import block (lines 1 to the last import line inclusive) with the sorted, formatted imports. Keep one blank line between imports and the rest of the file. Do not touch code below imports.

### Step 6 - Verify

Confirm:

- No import line remains unwrapped when single-line length is `>= 120`
- Import order matches the requested sort direction
- No import was added or removed
- Rest of file is unchanged

