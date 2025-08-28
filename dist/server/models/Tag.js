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
exports.Tag = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
// Import the associated models
const User_1 = require("../models/User"); // Import User model
const TodoTag_1 = require("./TodoTag");
const MediaTag_1 = require("./MediaTag");
const Todo_1 = require("./Todo"); // Import Todo model
const Media_1 = require("./Media"); // Import Media model
let Tag = class Tag extends sequelize_typescript_1.Model {
};
exports.Tag = Tag;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], Tag.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", String)
], Tag.prototype, "tag_name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", String)
], Tag.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => User_1.User),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Tag.prototype, "user_id", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => User_1.User),
    __metadata("design:type", User_1.User)
], Tag.prototype, "user", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsToMany)(() => Todo_1.Todo, () => TodoTag_1.TodoTag),
    __metadata("design:type", Array)
], Tag.prototype, "todos", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsToMany)(() => Media_1.Media, () => MediaTag_1.MediaTag),
    __metadata("design:type", Array)
], Tag.prototype, "media", void 0);
exports.Tag = Tag = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'tags', timestamps: false })
], Tag);
//# sourceMappingURL=Tag.js.map