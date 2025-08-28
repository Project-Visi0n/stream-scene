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
exports.FileSegment = void 0;
// server/src/models/FileSegment.ts
const sequelize_typescript_1 = require("sequelize-typescript");
const Note_1 = require("./Note");
let FileSegment = class FileSegment extends sequelize_typescript_1.Model {
};
exports.FileSegment = FileSegment;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    }),
    __metadata("design:type", Number)
], FileSegment.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Note_1.Note),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    __metadata("design:type", Number)
], FileSegment.prototype, "note_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.TEXT),
    __metadata("design:type", String)
], FileSegment.prototype, "path", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Note_1.Note),
    __metadata("design:type", Note_1.Note)
], FileSegment.prototype, "note", void 0);
exports.FileSegment = FileSegment = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: '`File Segment`', timestamps: false }) // 👈 if you must keep this name
], FileSegment);
//# sourceMappingURL=FileSegment.js.map