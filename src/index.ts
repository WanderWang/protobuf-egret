import * as child_process from 'child_process';
import * as fs from 'fs-extra-promise';
import * as path from 'path';
import * as UglifyJS from 'uglify-js';
import * as os from 'os';

const root = path.resolve(__filename, '../../');

function shell(command: string, args: string[]) {
    return new Promise<string>((resolve, reject) => {

        const cmd = command + " " + args.join(" ");
        child_process.exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(stdout)
            }
        })
    })
}


async function generate(egretProjectPath: string) {
    const rootDir = path.join(egretProjectPath, 'protobuf');
    if (!await (fs.existsAsync(rootDir))) {
        console.error('当前目录不存在 protobuf 文件夹，请首先执行 pb-egret add 命令');
        process.exit(1);
    }
    const tempfile = path.join(os.tmpdir(), 'pbegret', 'temp.js');
    await fs.mkdirpAsync(path.dirname(tempfile));
    const output = path.join(egretProjectPath, '/protobuf/bundles/protobuf-bundles.js');
    const dirname = path.dirname(output);
    await fs.mkdirpAsync(dirname);
    const protoRoot = path.join(egretProjectPath, 'protobuf/protofile');
    const fileList = await fs.readdirAsync(protoRoot);
    const protoList = fileList.filter(item => path.extname(item) === '.proto')
    await shell('pbjs', ['-t', 'static', '-p', protoRoot, protoList.join(" "), '-o', tempfile]);
    let pbjsResult = await fs.readFileAsync(tempfile, 'utf-8');
    pbjsResult = 'var $protobuf = window.protobuf;\n$protobuf.roots.default=window;\n' + pbjsResult;
    await fs.writeFileAsync(output, pbjsResult, 'utf-8');
    const minjs = UglifyJS.minify(pbjsResult);
    await fs.writeFileAsync(output.replace('.js', '.min.js'), minjs.code, 'utf-8');
    await shell('pbts', ['--main', output, '-o', tempfile]);
    let pbtsResult = await fs.readFileAsync(tempfile, 'utf-8');
    pbtsResult = pbtsResult.replace(/\$protobuf/gi, "protobuf").replace(/export namespace/gi, 'declare namespace');
    pbtsResult = 'type Long = protobuf.Long;\n' + pbtsResult;
    await fs.writeFileAsync(output.replace(".js", ".d.ts"), pbtsResult, 'utf-8');
    await fs.removeAsync(tempfile);

}



async function add(egretProjectRoot: string) {
    console.log('正在将 protobuf 源码拷贝至项目中...');
    await fs.copyAsync(path.join(root, 'dist'), path.join(egretProjectRoot, 'protobuf/library'));
    await fs.mkdirpSync(path.join(egretProjectRoot, 'protobuf/protofile'));
    await fs.mkdirpSync(path.join(egretProjectRoot, 'protobuf/bundles'));

    const egretPropertiesPath = path.join(egretProjectRoot, 'egretProperties.json');
    if (await fs.existsAsync(egretPropertiesPath)) {
        console.log('正在将 protobuf 添加到 egretProperties.json 中...');
        const egretProperties = await fs.readJSONAsync(egretPropertiesPath);
        egretProperties.modules.push({ name: 'protobuf-library', path: 'protobuf/library' });
        egretProperties.modules.push({ name: 'protobuf-bundles', path: 'protobuf/bundles' });
        await fs.writeFileAsync(path.join(egretProjectRoot, 'egretProperties.json'), JSON.stringify(egretProperties, null, '\t\t'));
        console.log('正在将 protobuf 添加到 tsconfig.json 中...');
        const tsconfig = await fs.readJSONAsync(path.join(egretProjectRoot, 'tsconfig.json'));
        tsconfig.include.push('protobuf/**/*.d.ts');
        await fs.writeFileAsync(path.join(egretProjectRoot, 'tsconfig.json'), JSON.stringify(tsconfig, null, '\t\t'));
    }
    else {
        console.log('输入的文件夹不是白鹭引擎项目')
    }


}


export function run(command: string, egretProjectRoot: string) {
    run_1(command, egretProjectRoot).catch(e => console.log(e))
}

async function run_1(command: string, egretProjectRoot: string) {

    if (command == "add") {
        await add(egretProjectRoot);
    }
    else if (command == "generate") {
        await generate(egretProjectRoot)
    }
    else {
        console.error('请输入命令: add / generate')
    }

}