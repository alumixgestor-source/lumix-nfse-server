export declare const ATTR_PREFIX = "@_";
export declare const TEXT_NODE = "#text";
export type XmlNode = string | XmlObject | XmlNode[];
export interface XmlObject {
    readonly [key: string]: XmlNode | undefined;
}
export declare function parseXml(xml: string): XmlObject;
//# sourceMappingURL=parser.d.ts.map