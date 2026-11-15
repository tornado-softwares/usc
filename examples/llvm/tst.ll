declare i32 @puts(ptr)
@str.1 = constant [14 x i8] c"Yo libc\00"
define i32 @main() {
  call i32 @puts(ptr @str.1)
  ret i32 0
}
