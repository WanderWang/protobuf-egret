import * as child_process from 'child_process';
import * as fs from 'fs-extra-promise';
import * as path from 'path';
import * as UglifyJS from 'uglify-js';

const root = path.resolve(process.argv[1], '../../');

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

            // console.log(stdout, stderr)
        })
    })
}


async function generate() {

    const output = 'egret-project/protobuf/bundles/protobuf-bundles.js';
    const dirname = path.dirname(output);
    await fs.mkdirpAsync(dirname);

    let pbjsResult = await shell('pbjs', ['-t', 'static', './awesome.proto']);
    pbjsResult = 'var $protobuf = window.protobuf;\n$protobuf.roots.default=window;\n' + pbjsResult;
    await fs.writeFileAsync(output, pbjsResult, 'utf-8');
    const minjs = UglifyJS.minify(pbjsResult);
    await fs.writeFileAsync(output.replace('.js', '.min.js'), minjs.code, 'utf-8');
    let pbtsResult = await shell('pbts', ['--main', output]);
    pbtsResult = pbtsResult.replace(/\$protobuf/gi, "protobuf");
    await fs.writeFileAsync(output.replace(".js", ".d.ts"), pbtsResult, 'utf-8');

}

generate().then((error) => {

}).catch((error) => {
    console.log(error.message)
})


async function addToEgret(egretProjectRoot: string) {
    await fs.copyAsync(path.join(root, 'dist'), path.join(egretProjectRoot, 'protobuf/library'));
    const egretProperties = fs.readJSONAsync(path.join(egretProjectRoot, 'egretProperties.json'));
    console.log(egretProperties)

}


export function run(command: string, egretProjectRoot: string) {
    run_1(command, egretProjectRoot).catch(e => console.log(e))
}

async function run_1(command: string, egretProjectRoot: string) {

    if (command == "add") {
        await addToEgret(egretProjectRoot);
    }
    else if (command == "generate") {
        await generate()
    }

}