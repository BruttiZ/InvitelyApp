import { spawnSync } from 'node:child_process';
import path from 'node:path';

const files = process.argv.slice(2).map((file) => {
    const relativePath = path.isAbsolute(file) ? path.relative(process.cwd(), file) : file;

    return relativePath.replaceAll('\\', '/');
});

function run(command, args) {
    return spawnSync(command, args, {
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });
}

function isAvailable(command) {
    const check = spawnSync(command, ['-v'], {
        stdio: 'ignore',
        shell: process.platform === 'win32',
    });

    return !check.error && check.status === 0;
}

const result = isAvailable('php')
    ? run('php', ['vendor/bin/pint', ...files])
    : run('docker', ['compose', 'exec', '-T', 'app', 'vendor/bin/pint', ...files]);

process.exit(result.status ?? 1);
