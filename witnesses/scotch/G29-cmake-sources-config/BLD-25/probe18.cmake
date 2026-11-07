# Exact line 67 of src/CMakeLists.txt in 7.0.18 (after 49149c10), fed a chosen host name
set(CMAKE_HOST_SYSTEM_NAME "${HOSTNAME_FAKE}")
if(${CMAKE_HOST_SYSTEM_NAME} MATCHES "^.*FreeBSD.*$")
  message(STATUS "7.0.18 line 67 with host [${HOSTNAME_FAKE}]: FreeBSD detected")
else()
  message(STATUS "7.0.18 line 67 with host [${HOSTNAME_FAKE}]: not FreeBSD")
endif()
