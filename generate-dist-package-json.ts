import { readFile, writeFile } from 'fs/promises';

const OUTPUT_FILE = 'dist/package.json';
const PACKAGE_INFO_PROPERTIES_TO_EXCLUDE = ['scripts', 'devDependencies'];
const PACKAGE_INFO_ADDITIONAL_PROPERTIES = {
    sideEffects: false,
    main: 'index.js',
    typings: 'index.d.ts',
};

generateDistributionPackageJsonFile();

async function generateDistributionPackageJsonFile(): Promise<void> {
    const packageInfo = JSON.parse(await readFile('package.json', { encoding: 'utf8' }));

    const updatedPackageInfo = {
        ...omit(packageInfo, ...PACKAGE_INFO_PROPERTIES_TO_EXCLUDE),
        ...PACKAGE_INFO_ADDITIONAL_PROPERTIES,
    };

    await writeFile(
        OUTPUT_FILE,
        JSON.stringify(updatedPackageInfo, undefined, '  '),
        { encoding: 'utf8' },
    );
}

function omit<T extends {}, K extends keyof T>(value: T, ...keys: K[]): Omit<T, K> {
    return Object.entries(value).reduce(
        (result, [key, value]) => keys.includes(key as K) ? result : { ...result, [key]: value },
        {} as Omit<T, K>,
    );
}
