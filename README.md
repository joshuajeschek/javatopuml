# javatopuml

Tool to create [PlantUML](https://plantuml.com/) Class-Diagrams from Java Code.

## Usage

1. Install globally
    * npm:
        ```console
        npm install javatopuml --global
        ```
    * yarn:
        ```console
        yarn global add javatopuml
        ```

2. Invoke in any Java Project
    ```console
    javatopuml
    ```
    or with options:
    ```console
    javatopuml [--path=INPUT_PATH; default: .] \
        [--output=OUTPUT_PATH; default: ./target/puml] \
        [--format=OUTPUT_FORMAT; default: puml] \
        [--linkbyfields={true | false}; default: true] \
        [--inheritance={true | false}; default: true]
    ```
    ⇒ The results will be saved in `target/plantuml`

```console
Positionals:
  packages                                                               [array]

Options:
  --help          Show help                                            [boolean]
  --version       Show version number                                  [boolean]
  --path          The path of the java project
                                           [string] [default: current directory]
  --output                                   [string] [default: "./target/puml"]
  --format                                            [string] [default: "puml"]
  --linkbyfields                                       [boolean] [default: true]
  --inheritance                                        [boolean] [default: true]

Examples:
  javatopuml                         Generates a class diagram of the project
                                     the command is invoked in
  javatopuml my.super.nice.package   Generates a class diagram of the package,
                                     if it can be found in the current project
  javatopuml --format=txt            Outputs to <packagename>.txt instead of
                                     <packagename>.puml
  javatopuml --output=classdiagrams  Outputs to
                                     ./classdiagrams/<packagename>.puml instead
                                     of ./target/plantuml/<packagename>.puml
```

### Options
| option       | default           |                                                                                                           |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------------- |
| packages     |                   | Fully Qualified Names of the packages that should be rendered. If ommited, full project will be rendered. |
| path         | current directory | The input path, where the Java project is to be found.                                                    |
| ouput        | ./target/puml     | The output path of the diagram files.                                                                     |
| format       | puml              | The output format of the diagram files. Will always be textbased.                                         |
| linkbyfields | true              | Wether the tool should generate links between classes based on the fields types.                          |
| inheritance  | true              | Wether the tool should generate links based on inheritance (extends & implements)                         |

## know limitations
* the code has only been tested with valid java code, and not extensively
* records do not work yet.
