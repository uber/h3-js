/*
 * Copyright 2022 Uber Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"),
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview
 * Create Typescript types for the legacy v3 API and write to dist. Depends
 * on the current v4 types already being generated in dist.
 */

const fs = require('fs');
const path = require('path');
const mapping = require('../lib/legacy-mapping');

let content = fs.readFileSync(path.join(__dirname, '../dist/types.d.ts'), 'utf-8');

for (const [oldName, newName] of Object.entries(mapping)) {
    const regex = new RegExp(`\\b${newName}\\b`, 'g');
    content = content.replace(regex, oldName);
}

fs.writeFileSync(path.join(__dirname, '../dist/legacy-types.d.ts'), content, 'utf-8');
