"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoTag = void 0;
// server/src/models/TodoTag.ts
const sequelize_typescript_1 = require("sequelize-typescript");
const Todo_1 = require("./Todo");
const Tag_1 = require("./Tag");
let TodoTag = class TodoTag extends sequelize_typescript_1.Model {
};
exports.TodoTag = TodoTag;
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Todo_1.Todo),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BIGINT, primaryKey: true }),
    __metadata("design:type", Number)
], TodoTag.prototype, "todo_id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Tag_1.Tag),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BIGINT, primaryKey: true }),
    __metadata("design:type", Number)
], TodoTag.prototype, "tag_id", void 0);
exports.TodoTag = TodoTag = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'Todo_tags', timestamps: false })
], TodoTag);
//# sourceMappingURL=TodoTag.js.map