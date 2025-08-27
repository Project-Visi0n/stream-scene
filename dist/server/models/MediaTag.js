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
exports.MediaTag = void 0;
// server/src/models/MediaTag.ts
const sequelize_typescript_1 = require("sequelize-typescript");
const Media_1 = require("./Media");
const Tag_1 = require("./Tag");
let MediaTag = class MediaTag extends sequelize_typescript_1.Model {
};
exports.MediaTag = MediaTag;
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Media_1.Media),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BIGINT, primaryKey: true }),
    __metadata("design:type", Number)
], MediaTag.prototype, "media_id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Tag_1.Tag),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BIGINT, primaryKey: true }),
    __metadata("design:type", Number)
], MediaTag.prototype, "tag_id", void 0);
exports.MediaTag = MediaTag = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'Media_tags', timestamps: false })
], MediaTag);
//# sourceMappingURL=MediaTag.js.map