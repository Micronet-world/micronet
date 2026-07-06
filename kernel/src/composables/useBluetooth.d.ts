declare global {
    interface BluetoothDevice {
        id: string;
        name?: string;
        gatt?: BluetoothRemoteGATTServer;
        addEventListener(type: string, listener: (this: BluetoothDevice, ev: Event) => void): void;
        removeEventListener(type: string, listener: (this: BluetoothDevice, ev: Event) => void): void;
    }
    interface BluetoothRemoteGATTServer {
        device: BluetoothDevice;
        connected: boolean;
        connect(): Promise<BluetoothRemoteGATTServer>;
        disconnect(): void;
        getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
        getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
    }
    interface BluetoothRemoteGATTService {
        uuid: string;
        device: BluetoothDevice;
        isPrimary: boolean;
        getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
        getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
    }
    interface BluetoothRemoteGATTCharacteristic {
        uuid: string;
        service: BluetoothRemoteGATTService;
        properties: BluetoothCharacteristicProperties;
        value?: DataView;
        readValue(): Promise<DataView>;
        writeValue(value: BufferSource): Promise<void>;
        writeValueWithResponse(value: BufferSource): Promise<void>;
        writeValueWithoutResponse(value: BufferSource): Promise<void>;
        startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
        stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
        addEventListener(type: string, listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void): void;
        removeEventListener(type: string, listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void): void;
    }
    interface BluetoothCharacteristicProperties {
        read: boolean;
        write: boolean;
        writeWithoutResponse: boolean;
        notify: boolean;
        indicate: boolean;
        broadcast: boolean;
        reliableWrite: boolean;
        writableAuxiliaries: boolean;
    }
    type BluetoothServiceUUID = string;
    type BluetoothCharacteristicUUID = string;
    interface RequestDeviceOptions {
        filters?: BluetoothLEScanFilter[];
        optionalServices?: BluetoothServiceUUID[];
        acceptAllDevices?: boolean;
    }
    interface BluetoothLEScanFilter {
        services?: BluetoothServiceUUID[];
        name?: string;
        namePrefix?: string;
    }
    interface Bluetooth {
        requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
        getAvailability(): Promise<boolean>;
    }
    interface Navigator {
        bluetooth?: Bluetooth;
    }
}
export interface BTService {
    uuid: string;
    name: string;
    isPrimary: boolean;
    characteristics: BTCharacteristic[];
}
export interface BTCharacteristic {
    uuid: string;
    name: string;
    serviceUuid: string;
    properties: {
        read: boolean;
        write: boolean;
        writeWithoutResponse: boolean;
        notify: boolean;
        indicate: boolean;
    };
    value: DataView | null;
    notifying: boolean;
}
export interface BTDevice {
    id: string;
    name: string;
    connected: boolean;
    services: BTService[];
    _raw: BluetoothDevice;
    _server: BluetoothRemoteGATTServer | null;
    _charMap: Map<string, BluetoothRemoteGATTCharacteristic>;
}
export declare function useBluetooth(): {
    isSupported: import("vue").Ref<boolean, boolean>;
    isScanning: import("vue").Ref<boolean, boolean>;
    pairedDevices: import("vue").Ref<{
        id: string;
        name: string;
        connected: boolean;
        services: {
            uuid: string;
            name: string;
            isPrimary: boolean;
            characteristics: {
                uuid: string;
                name: string;
                serviceUuid: string;
                properties: {
                    read: boolean;
                    write: boolean;
                    writeWithoutResponse: boolean;
                    notify: boolean;
                    indicate: boolean;
                };
                value: {
                    readonly buffer: {
                        readonly byteLength: number;
                        slice: (begin?: number, end?: number) => ArrayBuffer;
                        readonly [Symbol.toStringTag]: "ArrayBuffer";
                    } | {
                        readonly byteLength: number;
                        slice: (begin?: number, end?: number) => SharedArrayBuffer;
                        readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                    };
                    readonly byteLength: number;
                    readonly byteOffset: number;
                    getFloat32: (byteOffset: number, littleEndian?: boolean) => number;
                    getFloat64: (byteOffset: number, littleEndian?: boolean) => number;
                    getInt8: (byteOffset: number) => number;
                    getInt16: (byteOffset: number, littleEndian?: boolean) => number;
                    getInt32: (byteOffset: number, littleEndian?: boolean) => number;
                    getUint8: (byteOffset: number) => number;
                    getUint16: (byteOffset: number, littleEndian?: boolean) => number;
                    getUint32: (byteOffset: number, littleEndian?: boolean) => number;
                    setFloat32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setFloat64: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setInt8: (byteOffset: number, value: number) => void;
                    setInt16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setInt32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setUint8: (byteOffset: number, value: number) => void;
                    setUint16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setUint32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    getBigInt64: (byteOffset: number, littleEndian?: boolean) => bigint;
                    getBigUint64: (byteOffset: number, littleEndian?: boolean) => bigint;
                    setBigInt64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                    setBigUint64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                    readonly [Symbol.toStringTag]: string;
                } | null;
                notifying: boolean;
            }[];
        }[];
        _raw: {
            id: string;
            name?: string | undefined;
            gatt?: {
                device: /*elided*/ any;
                connected: boolean;
                connect: () => Promise<BluetoothRemoteGATTServer>;
                disconnect: () => void;
                getPrimaryService: (service: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService>;
                getPrimaryServices: (service?: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService[]>;
            } | undefined;
            addEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
            removeEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
        };
        _server: {
            device: {
                id: string;
                name?: string | undefined;
                gatt?: /*elided*/ any | undefined;
                addEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
                removeEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
            };
            connected: boolean;
            connect: () => Promise<BluetoothRemoteGATTServer>;
            disconnect: () => void;
            getPrimaryService: (service: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService>;
            getPrimaryServices: (service?: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService[]>;
        } | null;
        _charMap: Map<string, {
            uuid: string;
            service: {
                uuid: string;
                device: {
                    id: string;
                    name?: string | undefined;
                    gatt?: {
                        device: /*elided*/ any;
                        connected: boolean;
                        connect: () => Promise<BluetoothRemoteGATTServer>;
                        disconnect: () => void;
                        getPrimaryService: (service: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService>;
                        getPrimaryServices: (service?: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService[]>;
                    } | undefined;
                    addEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
                    removeEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
                };
                isPrimary: boolean;
                getCharacteristic: (characteristic: BluetoothCharacteristicUUID) => Promise<BluetoothRemoteGATTCharacteristic>;
                getCharacteristics: (characteristic?: BluetoothCharacteristicUUID) => Promise<BluetoothRemoteGATTCharacteristic[]>;
            };
            properties: {
                read: boolean;
                write: boolean;
                writeWithoutResponse: boolean;
                notify: boolean;
                indicate: boolean;
                broadcast: boolean;
                reliableWrite: boolean;
                writableAuxiliaries: boolean;
            };
            value?: {
                readonly buffer: {
                    readonly byteLength: number;
                    slice: (begin?: number, end?: number) => ArrayBuffer;
                    readonly [Symbol.toStringTag]: "ArrayBuffer";
                } | {
                    readonly byteLength: number;
                    slice: (begin?: number, end?: number) => SharedArrayBuffer;
                    readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                };
                readonly byteLength: number;
                readonly byteOffset: number;
                getFloat32: (byteOffset: number, littleEndian?: boolean) => number;
                getFloat64: (byteOffset: number, littleEndian?: boolean) => number;
                getInt8: (byteOffset: number) => number;
                getInt16: (byteOffset: number, littleEndian?: boolean) => number;
                getInt32: (byteOffset: number, littleEndian?: boolean) => number;
                getUint8: (byteOffset: number) => number;
                getUint16: (byteOffset: number, littleEndian?: boolean) => number;
                getUint32: (byteOffset: number, littleEndian?: boolean) => number;
                setFloat32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setFloat64: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setInt8: (byteOffset: number, value: number) => void;
                setInt16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setInt32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setUint8: (byteOffset: number, value: number) => void;
                setUint16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setUint32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                getBigInt64: (byteOffset: number, littleEndian?: boolean) => bigint;
                getBigUint64: (byteOffset: number, littleEndian?: boolean) => bigint;
                setBigInt64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                setBigUint64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                readonly [Symbol.toStringTag]: string;
            } | undefined;
            readValue: () => Promise<DataView>;
            writeValue: (value: BufferSource) => Promise<void>;
            writeValueWithResponse: (value: BufferSource) => Promise<void>;
            writeValueWithoutResponse: (value: BufferSource) => Promise<void>;
            startNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
            stopNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
            addEventListener: (type: string, listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void) => void;
            removeEventListener: (type: string, listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void) => void;
        }> & Omit<Map<string, BluetoothRemoteGATTCharacteristic>, keyof Map<any, any>>;
    }[], BTDevice[] | {
        id: string;
        name: string;
        connected: boolean;
        services: {
            uuid: string;
            name: string;
            isPrimary: boolean;
            characteristics: {
                uuid: string;
                name: string;
                serviceUuid: string;
                properties: {
                    read: boolean;
                    write: boolean;
                    writeWithoutResponse: boolean;
                    notify: boolean;
                    indicate: boolean;
                };
                value: {
                    readonly buffer: {
                        readonly byteLength: number;
                        slice: (begin?: number, end?: number) => ArrayBuffer;
                        readonly [Symbol.toStringTag]: "ArrayBuffer";
                    } | {
                        readonly byteLength: number;
                        slice: (begin?: number, end?: number) => SharedArrayBuffer;
                        readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                    };
                    readonly byteLength: number;
                    readonly byteOffset: number;
                    getFloat32: (byteOffset: number, littleEndian?: boolean) => number;
                    getFloat64: (byteOffset: number, littleEndian?: boolean) => number;
                    getInt8: (byteOffset: number) => number;
                    getInt16: (byteOffset: number, littleEndian?: boolean) => number;
                    getInt32: (byteOffset: number, littleEndian?: boolean) => number;
                    getUint8: (byteOffset: number) => number;
                    getUint16: (byteOffset: number, littleEndian?: boolean) => number;
                    getUint32: (byteOffset: number, littleEndian?: boolean) => number;
                    setFloat32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setFloat64: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setInt8: (byteOffset: number, value: number) => void;
                    setInt16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setInt32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setUint8: (byteOffset: number, value: number) => void;
                    setUint16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setUint32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    getBigInt64: (byteOffset: number, littleEndian?: boolean) => bigint;
                    getBigUint64: (byteOffset: number, littleEndian?: boolean) => bigint;
                    setBigInt64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                    setBigUint64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                    readonly [Symbol.toStringTag]: string;
                } | null;
                notifying: boolean;
            }[];
        }[];
        _raw: {
            id: string;
            name?: string | undefined;
            gatt?: {
                device: /*elided*/ any;
                connected: boolean;
                connect: () => Promise<BluetoothRemoteGATTServer>;
                disconnect: () => void;
                getPrimaryService: (service: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService>;
                getPrimaryServices: (service?: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService[]>;
            } | undefined;
            addEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
            removeEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
        };
        _server: {
            device: {
                id: string;
                name?: string | undefined;
                gatt?: /*elided*/ any | undefined;
                addEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
                removeEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
            };
            connected: boolean;
            connect: () => Promise<BluetoothRemoteGATTServer>;
            disconnect: () => void;
            getPrimaryService: (service: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService>;
            getPrimaryServices: (service?: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService[]>;
        } | null;
        _charMap: Map<string, {
            uuid: string;
            service: {
                uuid: string;
                device: {
                    id: string;
                    name?: string | undefined;
                    gatt?: {
                        device: /*elided*/ any;
                        connected: boolean;
                        connect: () => Promise<BluetoothRemoteGATTServer>;
                        disconnect: () => void;
                        getPrimaryService: (service: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService>;
                        getPrimaryServices: (service?: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService[]>;
                    } | undefined;
                    addEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
                    removeEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
                };
                isPrimary: boolean;
                getCharacteristic: (characteristic: BluetoothCharacteristicUUID) => Promise<BluetoothRemoteGATTCharacteristic>;
                getCharacteristics: (characteristic?: BluetoothCharacteristicUUID) => Promise<BluetoothRemoteGATTCharacteristic[]>;
            };
            properties: {
                read: boolean;
                write: boolean;
                writeWithoutResponse: boolean;
                notify: boolean;
                indicate: boolean;
                broadcast: boolean;
                reliableWrite: boolean;
                writableAuxiliaries: boolean;
            };
            value?: {
                readonly buffer: {
                    readonly byteLength: number;
                    slice: (begin?: number, end?: number) => ArrayBuffer;
                    readonly [Symbol.toStringTag]: "ArrayBuffer";
                } | {
                    readonly byteLength: number;
                    slice: (begin?: number, end?: number) => SharedArrayBuffer;
                    readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                };
                readonly byteLength: number;
                readonly byteOffset: number;
                getFloat32: (byteOffset: number, littleEndian?: boolean) => number;
                getFloat64: (byteOffset: number, littleEndian?: boolean) => number;
                getInt8: (byteOffset: number) => number;
                getInt16: (byteOffset: number, littleEndian?: boolean) => number;
                getInt32: (byteOffset: number, littleEndian?: boolean) => number;
                getUint8: (byteOffset: number) => number;
                getUint16: (byteOffset: number, littleEndian?: boolean) => number;
                getUint32: (byteOffset: number, littleEndian?: boolean) => number;
                setFloat32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setFloat64: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setInt8: (byteOffset: number, value: number) => void;
                setInt16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setInt32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setUint8: (byteOffset: number, value: number) => void;
                setUint16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setUint32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                getBigInt64: (byteOffset: number, littleEndian?: boolean) => bigint;
                getBigUint64: (byteOffset: number, littleEndian?: boolean) => bigint;
                setBigInt64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                setBigUint64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                readonly [Symbol.toStringTag]: string;
            } | undefined;
            readValue: () => Promise<DataView>;
            writeValue: (value: BufferSource) => Promise<void>;
            writeValueWithResponse: (value: BufferSource) => Promise<void>;
            writeValueWithoutResponse: (value: BufferSource) => Promise<void>;
            startNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
            stopNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
            addEventListener: (type: string, listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void) => void;
            removeEventListener: (type: string, listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void) => void;
        }> & Omit<Map<string, BluetoothRemoteGATTCharacteristic>, keyof Map<any, any>>;
    }[]>;
    discoveredDevices: import("vue").Ref<{
        id: string;
        name: string;
        connected: boolean;
        services: {
            uuid: string;
            name: string;
            isPrimary: boolean;
            characteristics: {
                uuid: string;
                name: string;
                serviceUuid: string;
                properties: {
                    read: boolean;
                    write: boolean;
                    writeWithoutResponse: boolean;
                    notify: boolean;
                    indicate: boolean;
                };
                value: {
                    readonly buffer: {
                        readonly byteLength: number;
                        slice: (begin?: number, end?: number) => ArrayBuffer;
                        readonly [Symbol.toStringTag]: "ArrayBuffer";
                    } | {
                        readonly byteLength: number;
                        slice: (begin?: number, end?: number) => SharedArrayBuffer;
                        readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                    };
                    readonly byteLength: number;
                    readonly byteOffset: number;
                    getFloat32: (byteOffset: number, littleEndian?: boolean) => number;
                    getFloat64: (byteOffset: number, littleEndian?: boolean) => number;
                    getInt8: (byteOffset: number) => number;
                    getInt16: (byteOffset: number, littleEndian?: boolean) => number;
                    getInt32: (byteOffset: number, littleEndian?: boolean) => number;
                    getUint8: (byteOffset: number) => number;
                    getUint16: (byteOffset: number, littleEndian?: boolean) => number;
                    getUint32: (byteOffset: number, littleEndian?: boolean) => number;
                    setFloat32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setFloat64: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setInt8: (byteOffset: number, value: number) => void;
                    setInt16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setInt32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setUint8: (byteOffset: number, value: number) => void;
                    setUint16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setUint32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    getBigInt64: (byteOffset: number, littleEndian?: boolean) => bigint;
                    getBigUint64: (byteOffset: number, littleEndian?: boolean) => bigint;
                    setBigInt64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                    setBigUint64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                    readonly [Symbol.toStringTag]: string;
                } | null;
                notifying: boolean;
            }[];
        }[];
        _raw: {
            id: string;
            name?: string | undefined;
            gatt?: {
                device: /*elided*/ any;
                connected: boolean;
                connect: () => Promise<BluetoothRemoteGATTServer>;
                disconnect: () => void;
                getPrimaryService: (service: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService>;
                getPrimaryServices: (service?: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService[]>;
            } | undefined;
            addEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
            removeEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
        };
        _server: {
            device: {
                id: string;
                name?: string | undefined;
                gatt?: /*elided*/ any | undefined;
                addEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
                removeEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
            };
            connected: boolean;
            connect: () => Promise<BluetoothRemoteGATTServer>;
            disconnect: () => void;
            getPrimaryService: (service: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService>;
            getPrimaryServices: (service?: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService[]>;
        } | null;
        _charMap: Map<string, {
            uuid: string;
            service: {
                uuid: string;
                device: {
                    id: string;
                    name?: string | undefined;
                    gatt?: {
                        device: /*elided*/ any;
                        connected: boolean;
                        connect: () => Promise<BluetoothRemoteGATTServer>;
                        disconnect: () => void;
                        getPrimaryService: (service: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService>;
                        getPrimaryServices: (service?: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService[]>;
                    } | undefined;
                    addEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
                    removeEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
                };
                isPrimary: boolean;
                getCharacteristic: (characteristic: BluetoothCharacteristicUUID) => Promise<BluetoothRemoteGATTCharacteristic>;
                getCharacteristics: (characteristic?: BluetoothCharacteristicUUID) => Promise<BluetoothRemoteGATTCharacteristic[]>;
            };
            properties: {
                read: boolean;
                write: boolean;
                writeWithoutResponse: boolean;
                notify: boolean;
                indicate: boolean;
                broadcast: boolean;
                reliableWrite: boolean;
                writableAuxiliaries: boolean;
            };
            value?: {
                readonly buffer: {
                    readonly byteLength: number;
                    slice: (begin?: number, end?: number) => ArrayBuffer;
                    readonly [Symbol.toStringTag]: "ArrayBuffer";
                } | {
                    readonly byteLength: number;
                    slice: (begin?: number, end?: number) => SharedArrayBuffer;
                    readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                };
                readonly byteLength: number;
                readonly byteOffset: number;
                getFloat32: (byteOffset: number, littleEndian?: boolean) => number;
                getFloat64: (byteOffset: number, littleEndian?: boolean) => number;
                getInt8: (byteOffset: number) => number;
                getInt16: (byteOffset: number, littleEndian?: boolean) => number;
                getInt32: (byteOffset: number, littleEndian?: boolean) => number;
                getUint8: (byteOffset: number) => number;
                getUint16: (byteOffset: number, littleEndian?: boolean) => number;
                getUint32: (byteOffset: number, littleEndian?: boolean) => number;
                setFloat32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setFloat64: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setInt8: (byteOffset: number, value: number) => void;
                setInt16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setInt32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setUint8: (byteOffset: number, value: number) => void;
                setUint16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setUint32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                getBigInt64: (byteOffset: number, littleEndian?: boolean) => bigint;
                getBigUint64: (byteOffset: number, littleEndian?: boolean) => bigint;
                setBigInt64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                setBigUint64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                readonly [Symbol.toStringTag]: string;
            } | undefined;
            readValue: () => Promise<DataView>;
            writeValue: (value: BufferSource) => Promise<void>;
            writeValueWithResponse: (value: BufferSource) => Promise<void>;
            writeValueWithoutResponse: (value: BufferSource) => Promise<void>;
            startNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
            stopNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
            addEventListener: (type: string, listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void) => void;
            removeEventListener: (type: string, listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void) => void;
        }> & Omit<Map<string, BluetoothRemoteGATTCharacteristic>, keyof Map<any, any>>;
    }[], BTDevice[] | {
        id: string;
        name: string;
        connected: boolean;
        services: {
            uuid: string;
            name: string;
            isPrimary: boolean;
            characteristics: {
                uuid: string;
                name: string;
                serviceUuid: string;
                properties: {
                    read: boolean;
                    write: boolean;
                    writeWithoutResponse: boolean;
                    notify: boolean;
                    indicate: boolean;
                };
                value: {
                    readonly buffer: {
                        readonly byteLength: number;
                        slice: (begin?: number, end?: number) => ArrayBuffer;
                        readonly [Symbol.toStringTag]: "ArrayBuffer";
                    } | {
                        readonly byteLength: number;
                        slice: (begin?: number, end?: number) => SharedArrayBuffer;
                        readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                    };
                    readonly byteLength: number;
                    readonly byteOffset: number;
                    getFloat32: (byteOffset: number, littleEndian?: boolean) => number;
                    getFloat64: (byteOffset: number, littleEndian?: boolean) => number;
                    getInt8: (byteOffset: number) => number;
                    getInt16: (byteOffset: number, littleEndian?: boolean) => number;
                    getInt32: (byteOffset: number, littleEndian?: boolean) => number;
                    getUint8: (byteOffset: number) => number;
                    getUint16: (byteOffset: number, littleEndian?: boolean) => number;
                    getUint32: (byteOffset: number, littleEndian?: boolean) => number;
                    setFloat32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setFloat64: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setInt8: (byteOffset: number, value: number) => void;
                    setInt16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setInt32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setUint8: (byteOffset: number, value: number) => void;
                    setUint16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    setUint32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                    getBigInt64: (byteOffset: number, littleEndian?: boolean) => bigint;
                    getBigUint64: (byteOffset: number, littleEndian?: boolean) => bigint;
                    setBigInt64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                    setBigUint64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                    readonly [Symbol.toStringTag]: string;
                } | null;
                notifying: boolean;
            }[];
        }[];
        _raw: {
            id: string;
            name?: string | undefined;
            gatt?: {
                device: /*elided*/ any;
                connected: boolean;
                connect: () => Promise<BluetoothRemoteGATTServer>;
                disconnect: () => void;
                getPrimaryService: (service: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService>;
                getPrimaryServices: (service?: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService[]>;
            } | undefined;
            addEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
            removeEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
        };
        _server: {
            device: {
                id: string;
                name?: string | undefined;
                gatt?: /*elided*/ any | undefined;
                addEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
                removeEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
            };
            connected: boolean;
            connect: () => Promise<BluetoothRemoteGATTServer>;
            disconnect: () => void;
            getPrimaryService: (service: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService>;
            getPrimaryServices: (service?: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService[]>;
        } | null;
        _charMap: Map<string, {
            uuid: string;
            service: {
                uuid: string;
                device: {
                    id: string;
                    name?: string | undefined;
                    gatt?: {
                        device: /*elided*/ any;
                        connected: boolean;
                        connect: () => Promise<BluetoothRemoteGATTServer>;
                        disconnect: () => void;
                        getPrimaryService: (service: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService>;
                        getPrimaryServices: (service?: BluetoothServiceUUID) => Promise<BluetoothRemoteGATTService[]>;
                    } | undefined;
                    addEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
                    removeEventListener: (type: string, listener: (this: BluetoothDevice, ev: Event) => void) => void;
                };
                isPrimary: boolean;
                getCharacteristic: (characteristic: BluetoothCharacteristicUUID) => Promise<BluetoothRemoteGATTCharacteristic>;
                getCharacteristics: (characteristic?: BluetoothCharacteristicUUID) => Promise<BluetoothRemoteGATTCharacteristic[]>;
            };
            properties: {
                read: boolean;
                write: boolean;
                writeWithoutResponse: boolean;
                notify: boolean;
                indicate: boolean;
                broadcast: boolean;
                reliableWrite: boolean;
                writableAuxiliaries: boolean;
            };
            value?: {
                readonly buffer: {
                    readonly byteLength: number;
                    slice: (begin?: number, end?: number) => ArrayBuffer;
                    readonly [Symbol.toStringTag]: "ArrayBuffer";
                } | {
                    readonly byteLength: number;
                    slice: (begin?: number, end?: number) => SharedArrayBuffer;
                    readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                };
                readonly byteLength: number;
                readonly byteOffset: number;
                getFloat32: (byteOffset: number, littleEndian?: boolean) => number;
                getFloat64: (byteOffset: number, littleEndian?: boolean) => number;
                getInt8: (byteOffset: number) => number;
                getInt16: (byteOffset: number, littleEndian?: boolean) => number;
                getInt32: (byteOffset: number, littleEndian?: boolean) => number;
                getUint8: (byteOffset: number) => number;
                getUint16: (byteOffset: number, littleEndian?: boolean) => number;
                getUint32: (byteOffset: number, littleEndian?: boolean) => number;
                setFloat32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setFloat64: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setInt8: (byteOffset: number, value: number) => void;
                setInt16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setInt32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setUint8: (byteOffset: number, value: number) => void;
                setUint16: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                setUint32: (byteOffset: number, value: number, littleEndian?: boolean) => void;
                getBigInt64: (byteOffset: number, littleEndian?: boolean) => bigint;
                getBigUint64: (byteOffset: number, littleEndian?: boolean) => bigint;
                setBigInt64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                setBigUint64: (byteOffset: number, value: bigint, littleEndian?: boolean) => void;
                readonly [Symbol.toStringTag]: string;
            } | undefined;
            readValue: () => Promise<DataView>;
            writeValue: (value: BufferSource) => Promise<void>;
            writeValueWithResponse: (value: BufferSource) => Promise<void>;
            writeValueWithoutResponse: (value: BufferSource) => Promise<void>;
            startNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
            stopNotifications: () => Promise<BluetoothRemoteGATTCharacteristic>;
            addEventListener: (type: string, listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void) => void;
            removeEventListener: (type: string, listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void) => void;
        }> & Omit<Map<string, BluetoothRemoteGATTCharacteristic>, keyof Map<any, any>>;
    }[]>;
    selectedDevice: import("vue").ShallowRef<BTDevice | null, BTDevice | null>;
    error: import("vue").Ref<string | null, string | null>;
    init: () => Promise<void>;
    requestDevice: () => Promise<BTDevice | null>;
    connect: (dev: BTDevice) => Promise<void>;
    disconnect: (dev: BTDevice) => Promise<void>;
    discoverServices: (dev: BTDevice) => Promise<BTService[]>;
    readCharacteristic: (dev: BTDevice, char: BTCharacteristic) => Promise<DataView | null>;
    writeCharacteristic: (dev: BTDevice, char: BTCharacteristic, value: ArrayBuffer, withResponse?: boolean) => Promise<boolean>;
    startNotifications: (dev: BTDevice, char: BTCharacteristic, callback: (value: DataView) => void) => Promise<boolean>;
    stopNotifications: (dev: BTDevice, char: BTCharacteristic) => Promise<boolean>;
    removeDevice: (dev: BTDevice) => void;
    selectDevice: (dev: BTDevice | null) => void;
    serviceDisplayName: (uuid: string) => string;
    characteristicDisplayName: (uuid: string) => string;
};
//# sourceMappingURL=useBluetooth.d.ts.map