export const languageBoilerplates = {
    javascript: `// JavaScript Example
function greet(name) {
  return "Hello, " + name + "!";
}
console.log(greet("World"));
`,

    typescript: `// TypeScript Example
function greet(name: string): string {
  return "Hello, " + name + "!";
}
console.log(greet("World"));
`,

    python: `# Python Example
def greet(name):
    return "Hello, " + name + "!"

print(greet("World"))
`,

    java: `// Java Example
public class Main {
    public static void main(String[] args) {
        System.out.println(greet("World"));
    }

    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}
`,

    c: `// C Example
#include <stdio.h>

void greet(const char* name) {
    printf("Hello, %s!\\n", name);
}

int main() {
    greet("World");
    return 0;
}
`,

    cpp: `// C++ Example
#include <iostream>
using namespace std;

void greet(const string& name) {
    cout << "Hello, " << name << "!" << endl;
}

int main() {
    greet("World");
    return 0;
}
`
};
