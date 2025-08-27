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
exports.Media = void 0;
// server/src/models/Media.ts
const sequelize_typescript_1 = require("sequelize-typescript");
const User_1 = require("../models/User");
const Comment_1 = require("./Comment");
const Tag_1 = require("./Tag");
const MediaTag_1 = require("./MediaTag");
let Media = class Media extends sequelize_typescript_1.Model {
};
exports.Media = Media;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    }),
    __metadata("design:type", Number)
], Media.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => User_1.User),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], Media.prototype, "user_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", String)
], Media.prototype, "file_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", String)
], Media.prototype, "format", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], Media.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", String)
], Media.prototype, "title", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.DATE),
    __metadata("design:type", Date)
], Media.prototype, "created_at", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    __metadata("design:type", String)
], Media.prototype, "external_link", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => User_1.User),
    __metadata("design:type", User_1.User)
], Media.prototype, "user", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Comment_1.Comment),
    __metadata("design:type", Array)
], Media.prototype, "comments", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsToMany)(() => Tag_1.Tag, () => MediaTag_1.MediaTag),
    __metadata("design:type", Array)
], Media.prototype, "tags", void 0);
exports.Media = Media = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'media', timestamps: false })
], Media);
//# sourceMappingURL=Media.js.map