import { type IDataObject, type IExecuteFunctions, type INodeProperties } from 'n8n-workflow';
export declare const description: INodeProperties[];
export declare function execute(context: IExecuteFunctions, itemIndex: number, baseUrl: string): Promise<IDataObject | null>;
