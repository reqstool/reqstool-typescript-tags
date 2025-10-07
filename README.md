# reqstool-typescript-tags

A tool for creating `reqstool` `annotation.yml` file.

## Use this as a dev dependency

```
npm install --save-dev reqstool-typescript-tags
```

Now you can use `reqstool-typescript-tags` script in `package.json`

```
{
    ...
    "scripts": {
        "reqstool": "reqstool-typescript-tags --inputs tests,src --output docs/reqstool/annotations.yml"
    },
    "devDependencies": {
        ...
        "@lfv.se/reqstool-typescript-tags": "0.1.0"
    }
    ...
}
```

## Run locally for testing purposes

```
npm run dev --  --inputs src,tests --output output/annotations.yml
```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.
