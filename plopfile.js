export default function (plop) {
    // ─── Endpoint Generator ───
    plop.setGenerator('endpoint', {
        description: 'Create a new API endpoint (handler + test)',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'Endpoint name (e.g. getUser, createOrder):',
            },
            {
                type: 'list',
                name: 'method',
                message: 'HTTP method:',
                choices: ['GET', 'POST', 'PUT', 'DELETE'],
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'backend/src/handlers/{{camelCase name}}.ts',
                templateFile: 'templates/endpoint/handler.ts.hbs',
            },
            {
                type: 'add',
                path: 'backend/test/handlers/{{camelCase name}}.test.ts',
                templateFile: 'templates/endpoint/handler.test.ts.hbs',
            },
            '✅ Handler and test created! Remember to:',
            '   1. Add Lambda function to infra/lib/infra-stack.ts',
            '   2. Add API Gateway route in infra-stack.ts',
            '   3. Register in OpenAPI registry if applicable',
        ],
    });

    // ─── Component Generator ───
    plop.setGenerator('component', {
        description: 'Create a new React component with Storybook story',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'Component name (PascalCase, e.g. UserCard):',
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'frontend/components/{{pascalCase name}}/{{pascalCase name}}.tsx',
                templateFile: 'templates/component/component.tsx.hbs',
            },
            {
                type: 'add',
                path: 'frontend/components/{{pascalCase name}}/index.ts',
                templateFile: 'templates/component/index.ts.hbs',
            },
            {
                type: 'add',
                path: 'frontend/stories/{{pascalCase name}}.stories.tsx',
                templateFile: 'templates/component/story.tsx.hbs',
            },
        ],
    });
}
