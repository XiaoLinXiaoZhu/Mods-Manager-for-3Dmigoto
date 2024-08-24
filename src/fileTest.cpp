//helloWorld
#include <iostream>
#include<filesystem>

using namespace std;
using namespace std::filesystem;


int main() {
    std::filesystem::path p = current_path();
    cout << "Current path is " << p << endl;
    return 0;
}