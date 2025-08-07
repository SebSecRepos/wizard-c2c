#define _GNU_SOURCE
#include <fcntl.h>
#include <unistd.h>
#include <sys/syscall.h>
#include <stdlib.h>
#include <stdio.h>

#ifndef MFD_CLOEXEC
#define MFD_CLOEXEC 0x0001
#endif

#ifndef SYS_memfd_create
#define SYS_memfd_create 319
#endif

int memfd_create(const char *name, unsigned int flags) {
    return syscall(SYS_memfd_create, name, flags);
}

int main() {
    int fd = memfd_create("payload", MFD_CLOEXEC);
    if (fd == -1) {
        perror("memfd_create");
        return 1;
    }

    int bin = open("linux.bin", O_RDONLY);
    if (bin < 0) {
        perror("open");
        return 1;
    }

    char buf[4096];
    ssize_t r;
    while ((r = read(bin, buf, sizeof(buf))) > 0) {
        if (write(fd, buf, r) != r) {
            perror("write");
            return 1;
        }
    }
    close(bin);

    lseek(fd, 0, SEEK_SET);

    char *const argv[] = {"payload", NULL};
    char *const envp[] = {NULL};
    fexecve(fd, argv, envp);

    perror("fexecve");
    return 1;
}

